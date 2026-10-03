"""Gera a narração do vídeo com o Piper (voz neural local, sem internet).

    python3 narracao.py [--modelo caminho/voz.onnx] [--velocidade 0.82]

Cria narracao/<cena>-<frase>.wav, uma por frase, e narracao/tempos.json com a
duração de cada uma. O vídeo (src/video.js) e a mixagem (render.mjs) leem
esse arquivo para sincronizar as animações com a fala.

Para trocar pela sua própria voz, grave cada frase com o mesmo nome de arquivo
(WAV mono) e rode `python3 narracao.py --so-tempos`: os tempos são recalculados
a partir das suas gravações.
"""

import argparse
import json
import wave
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
SAIDA = RAIZ / "narracao"


def frases():
    roteiro = json.loads((RAIZ / "src" / "roteiro.json").read_text(encoding="utf-8"))
    for c, cena in enumerate(roteiro["cenas"]):
        for i, frase in enumerate(cena["frases"]):
            yield f"{c + 1:02d}-{cena['id']}-{i + 1}", frase.get("fala") or frase["texto"]


def duracao(arquivo):
    with wave.open(str(arquivo), "rb") as w:
        return w.getnframes() / w.getframerate()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--modelo", default=str(RAIZ / "vozes" / "pt-br-edresson-low.onnx"))
    ap.add_argument("--velocidade", type=float, default=0.78, help="length_scale do Piper: menor = mais rápido")
    ap.add_argument("--so-tempos", action="store_true", help="só recalcula tempos.json a partir dos WAVs existentes")
    a = ap.parse_args()

    SAIDA.mkdir(exist_ok=True)
    voz = None
    if not a.so_tempos:
        from piper import PiperVoice, SynthesisConfig

        voz = PiperVoice.load(a.modelo)
        cfg = SynthesisConfig(length_scale=a.velocidade, noise_scale=0.6, noise_w_scale=0.7)

    tempos = {}
    for nome, texto in frases():
        arq = SAIDA / f"{nome}.wav"
        if voz is not None:
            with wave.open(str(arq), "wb") as w:
                voz.synthesize_wav(texto, w, syn_config=cfg)
        tempos[nome] = round(duracao(arq), 3)
        print(f"{nome:28s} {tempos[nome]:6.2f}s  {texto[:60]}")

    (SAIDA / "tempos.json").write_text(json.dumps(tempos, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"total de fala: {sum(tempos.values()):.1f}s")


if __name__ == "__main__":
    main()
