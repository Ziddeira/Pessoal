import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, easeIn, easeOut, prog} from '../lib/anim';
import {Contador, FundoClaro, Palavras, Selo} from '../lib/componentes';
import {cor, mono, sans, status} from '../lib/marca';

// Dados fictícios: 420 + 500 + 40 = 960h feitas; 320 + 480 + 120 = 920h exigidas.
const cenarios = [
	{nome: 'Atenção básica', feito: 420, meta: 320},
	{nome: 'Hospitalar', feito: 500, meta: 480},
	{nome: 'Saúde mental', feito: 40, meta: 120},
];

const Linha: React.FC<{nome: string; feito: number; meta: number; em: number; alerta: number}> = ({
	nome,
	feito,
	meta,
	em,
	alerta,
}) => {
	const frame = useCurrentFrame();
	const p = prog(frame, em, em + 16);
	const barra = prog(frame, em + 6, em + 34);
	const falta = feito < meta;
	const a = falta ? prog(frame, alerta, alerta + 10) : 0;
	const pct = Math.min(feito / meta, 1);
	return (
		<div
			style={{
				opacity: p,
				translate: `0px ${(1 - p) * 30}px`,
				padding: '22px 24px',
				margin: '0 -24px',
				borderRadius: 12,
				border: `2px solid ${a > 0.5 ? status.bloqueio.fg : 'transparent'}`,
				backgroundColor: `rgba(251,228,225,${a * 0.55})`,
			}}
		>
			<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
				<div style={{fontFamily: sans, fontWeight: 600, fontSize: 38, color: cor.ink}}>{nome}</div>
				<div style={{fontFamily: mono, fontWeight: 500, fontSize: 34, color: cor.ink2}}>
					{feito}h / {meta}h
				</div>
			</div>
			<div
				style={{
					marginTop: 16,
					height: 16,
					borderRadius: 8,
					backgroundColor: cor.line,
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						height: '100%',
						width: `${pct * barra * 100}%`,
						borderRadius: 8,
						backgroundColor: a > 0.5 ? status.bloqueio.fg : cor.primary,
					}}
				/>
			</div>
			<div style={{marginTop: 16, height: 40}}>
				{falta ? (
					<div style={{opacity: a, scale: String(interpolate(a, [0, 1], [0.8, 1]))}}>
						<Selo tipo="bloqueio">Bloqueio · faltam 80h</Selo>
					</div>
				) : (
					<div style={{opacity: prog(frame, em + 30, em + 40)}}>
						<Selo tipo="emDia">Em dia</Selo>
					</div>
				)}
			</div>
		</div>
	);
};

export const Aluna: React.FC = () => {
	const frame = useCurrentFrame();
	const entra = prog(frame, 14, 44);
	const sai = prog(frame, 226, 240, easeIn);
	return (
		<AbsoluteFill>
			<FundoClaro />
			<AbsoluteFill style={{alignItems: 'center', paddingTop: 210}}>
				<div style={{position: 'relative', height: 260, width: 960}}>
					<div style={{position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center'}}>
						<Palavras
							em={4}
							passo={5}
							tamanho={96}
							corBase={cor.ink}
							sai={150}
							trechos={[{t: 'Último semestre.'}]}
						/>
					</div>
					<div style={{position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center'}}>
						<Palavras
							em={160}
							passo={5}
							tamanho={92}
							corBase={cor.ink}
							sai={226}
							trechos={[
								{t: 'Fez as horas.'},
								{t: '\n'},
								{t: 'No cenário', cor: cor.ink2, peso: 600},
								{t: 'errado.', cor: status.bloqueio.fg},
							]}
						/>
					</div>
				</div>
			</AbsoluteFill>
			<AbsoluteFill style={{alignItems: 'center', paddingTop: 520, perspective: 1800}}>
				<div
					style={{
						width: 900,
						padding: 48,
						borderRadius: 24,
						backgroundColor: cor.surface,
						border: `2px solid ${cor.line}`,
						boxShadow: '0 40px 90px rgba(16,35,31,0.14)',
						opacity: entra * (1 - sai),
						filter: `blur(${(1 - entra) * 16 + sai * 18}px)`,
						translate: `0px ${(1 - entra) * 160}px`,
						transform: `rotateX(${(1 - entra) * 28 + sai * -16}deg) rotateZ(${interpolate(frame, [14, 240], [-1.2, 0.6], {...clamp, easing: easeOut})}deg)`,
					}}
				>
					<div style={{display: 'flex', alignItems: 'center', gap: 24}}>
						<div
							style={{
								width: 96,
								height: 96,
								borderRadius: 48,
								backgroundColor: cor.primarySoft,
								color: cor.primary,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontFamily: sans,
								fontWeight: 700,
								fontSize: 38,
							}}
						>
							AR
						</div>
						<div style={{flex: 1}}>
							<div style={{fontFamily: sans, fontWeight: 700, fontSize: 46, color: cor.ink}}>
								Ana Ribeiro
							</div>
							<div style={{fontFamily: sans, fontSize: 32, color: cor.muted, marginTop: 4}}>
								Enfermagem · 8º semestre
							</div>
						</div>
						<div style={{alignSelf: 'flex-start'}}>
							<Selo tipo="ficticio" tamanho={22}>
								Dados fictícios
							</Selo>
						</div>
					</div>

					<div
						style={{
							marginTop: 44,
							fontFamily: sans,
							fontWeight: 700,
							fontSize: 26,
							letterSpacing: '0.04em',
							color: cor.ink2,
						}}
					>
						HORAS DE ESTÁGIO
					</div>
					<div style={{display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 8}}>
						<Contador de={0} ate={960} em={34} dur={44} style={{fontSize: 120, color: cor.ink}} />
						<span style={{fontFamily: mono, fontWeight: 500, fontSize: 44, color: cor.muted}}>
							de 920h
						</span>
						<div style={{marginLeft: 'auto', opacity: prog(frame, 76, 88)}}>
							<Selo tipo="emDia">Em dia</Selo>
						</div>
					</div>

					<div style={{height: 2, backgroundColor: cor.line, margin: '40px 0 22px'}} />
					<div
						style={{
							fontFamily: sans,
							fontWeight: 700,
							fontSize: 26,
							letterSpacing: '0.04em',
							color: cor.ink2,
							marginBottom: 6,
							opacity: prog(frame, 96, 110),
						}}
					>
						POR CENÁRIO · RES. CNE/CES 1/2026
					</div>
					{cenarios.map((c, k) => (
						<Linha key={c.nome} {...c} em={100 + k * 12} alerta={146} />
					))}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
