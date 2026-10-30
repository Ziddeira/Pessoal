import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {clamp, prog} from '../lib/anim';
import {FundoEscuro, Palavras, Surge} from '../lib/componentes';
import {cor, sans} from '../lib/marca';

export const Chamada: React.FC = () => {
	const frame = useCurrentFrame();
	const logo = prog(frame, 4, 30);
	const toque = interpolate(frame, [92, 98, 108], [0, 1, 0], clamp);
	return (
		<AbsoluteFill>
			<FundoEscuro brilho={0.9} grade={0.4} />
			<AbsoluteFill style={{alignItems: 'center', paddingTop: 520}}>
				{/* Logo oficial, sem sombra, giro ou distorção. */}
				<Img
					src={staticFile('estagia-horizontal-negativo.svg')}
					style={{
						width: 680,
						opacity: logo,
						filter: `blur(${(1 - logo) * 14}px)`,
						translate: `0px ${(1 - logo) * 30}px`,
					}}
				/>
			</AbsoluteFill>
			<AbsoluteFill style={{alignItems: 'center', paddingTop: 860, gap: 56}}>
				<Palavras
					em={30}
					passo={4}
					tamanho={64}
					peso={600}
					trechos={[{t: 'Veja a conta das horas'}, {t: '\n'}, {t: 'com os dados do seu polo.', cor: cor.mint}]}
				/>
				<Surge em={58} y={40}>
					<div
						style={{
							height: 120,
							padding: '0 64px',
							borderRadius: 20,
							backgroundColor: cor.primary,
							border: `3px solid ${cor.mint}`,
							display: 'flex',
							alignItems: 'center',
							fontFamily: sans,
							fontWeight: 700,
							fontSize: 50,
							color: '#FFFFFF',
							scale: String(1 - toque * 0.05),
							boxShadow: `0 0 ${40 + toque * 40}px rgba(127,209,193,${0.25 + toque * 0.3})`,
						}}
					>
						Peça uma demonstração
					</div>
				</Surge>
				<Surge em={70}>
					<div style={{fontFamily: sans, fontWeight: 500, fontSize: 40, color: 'rgba(255,255,255,0.8)'}}>
						60 dias sem mensalidade
					</div>
				</Surge>
			</AbsoluteFill>
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 230}}>
				<Surge em={80}>
					<div style={{fontFamily: sans, fontWeight: 700, fontSize: 52, color: '#FFFFFF', letterSpacing: '-0.01em'}}>
						estagia.api.br
					</div>
				</Surge>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
