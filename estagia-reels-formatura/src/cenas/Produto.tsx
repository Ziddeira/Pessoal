import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {clamp, easeIn, prog} from '../lib/anim';
import {FundoClaro, Palavras, Selo, Surge} from '../lib/componentes';
import {cor, mono, sans} from '../lib/marca';

const Botao: React.FC<{
	children: React.ReactNode;
	contorno?: boolean;
	toque?: number;
}> = ({children, contorno, toque}) => {
	const frame = useCurrentFrame();
	const t = toque === undefined ? 0 : prog(frame, toque, toque + 18);
	const aperto = toque === undefined ? 0 : interpolate(frame, [toque, toque + 4, toque + 10], [0, 1, 0], clamp);
	return (
		<div
			style={{
				position: 'relative',
				overflow: 'hidden',
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				height: 88,
				padding: '0 40px',
				borderRadius: 16,
				backgroundColor: contorno ? cor.surface : cor.primary,
				border: `2px solid ${contorno ? cor.lineStrong : cor.primary}`,
				color: contorno ? cor.primary : '#FFFFFF',
				fontFamily: sans,
				fontWeight: 700,
				fontSize: 34,
				scale: String(1 - aperto * 0.05),
			}}
		>
			{children}
			{toque !== undefined && t > 0 && t < 1 ? (
				<div
					style={{
						position: 'absolute',
						left: '50%',
						top: '50%',
						width: 520,
						height: 520,
						marginLeft: -260,
						marginTop: -260,
						borderRadius: 260,
						backgroundColor: cor.mint,
						opacity: (1 - t) * 0.45,
						scale: String(t),
					}}
				/>
			) : null}
		</div>
	);
};

// Indicador do dedo tocando a tela.
const Toque: React.FC<{em: number; x: number; y: number}> = ({em, x, y}) => {
	const frame = useCurrentFrame();
	const a = prog(frame, em - 12, em);
	const s = prog(frame, em + 8, em + 20, easeIn);
	return (
		<div
			style={{
				position: 'absolute',
				left: x - 36,
				top: y - 36,
				width: 72,
				height: 72,
				borderRadius: 36,
				backgroundColor: 'rgba(127,209,193,0.85)',
				border: `3px solid ${cor.primary}`,
				opacity: a * (1 - s),
				scale: String(interpolate(frame, [em - 12, em, em + 4], [1.6, 1, 0.85], clamp)),
			}}
		/>
	);
};

export const Produto: React.FC = () => {
	const frame = useCurrentFrame();
	const entra = prog(frame, 16, 44);
	const sai = prog(frame, 284, 300, easeIn);
	const sugestao = prog(frame, 112, 136);
	const aviso = prog(frame, 200, 214);
	const avisoSai = prog(frame, 268, 280, easeIn);
	const aprovado = frame >= 196;
	return (
		<AbsoluteFill>
			<FundoClaro />
			<AbsoluteFill style={{alignItems: 'center', paddingTop: 170}}>
				<Palavras
					em={2}
					passo={4}
					tamanho={84}
					corBase={cor.ink}
					sai={284}
					trechos={[
						{t: 'Com a EstagIA,', cor: cor.ink2, peso: 600},
						{t: '\n'},
						{t: 'a conta é feita'},
						{t: '\n'},
						{t: 'todo dia.', cor: cor.primary},
					]}
				/>
			</AbsoluteFill>

			<AbsoluteFill style={{alignItems: 'center', paddingTop: 520, perspective: 1800}}>
				<div
					style={{
						width: 920,
						borderRadius: 24,
						overflow: 'hidden',
						backgroundColor: cor.surface,
						border: `2px solid ${cor.line}`,
						boxShadow: '0 40px 90px rgba(16,35,31,0.14)',
						opacity: entra * (1 - sai),
						filter: `blur(${(1 - entra) * 16 + sai * 18}px)`,
						translate: `0px ${(1 - entra) * 160 - sugestao * 40}px`,
						transform: `rotateX(${(1 - entra) * 24}deg)`,
					}}
				>
					<div
						style={{
							backgroundColor: cor.deep,
							padding: '26px 40px',
							display: 'flex',
							alignItems: 'center',
							gap: 18,
						}}
					>
						<Img src={staticFile('estagia-simbolo-negativo.svg')} style={{width: 56, height: 56}} />
						<div style={{fontFamily: sans, fontWeight: 700, fontSize: 34, color: '#FFFFFF', flex: 1}}>
							Painel do polo
						</div>
						<Selo tipo="ficticio" tamanho={22}>
							Dados fictícios
						</Selo>
					</div>

					<div style={{padding: '36px 40px 40px'}}>
						<div style={{fontFamily: sans, fontWeight: 700, fontSize: 40, color: cor.ink}}>
							O que precisa da sua atenção
						</div>

						<Surge em={40} y={30}>
							<div
								style={{
									marginTop: 28,
									padding: 32,
									borderRadius: 16,
									border: `2px solid ${cor.line}`,
								}}
							>
								<div style={{display: 'flex', alignItems: 'center', gap: 16}}>
									<div style={{position: 'relative', width: 230, height: 46}}>
										<div style={{position: 'absolute', opacity: aprovado ? 0 : 1}}>
											<Selo tipo="atencao">Atenção</Selo>
										</div>
										<div
											style={{
												position: 'absolute',
												opacity: prog(frame, 198, 208),
												scale: String(interpolate(prog(frame, 198, 208), [0, 1], [0.7, 1])),
											}}
										>
											<Selo tipo="agendado">Agendado</Selo>
										</div>
									</div>
								</div>
								<div
									style={{
										marginTop: 18,
										fontFamily: sans,
										fontWeight: 700,
										fontSize: 38,
										color: cor.ink,
									}}
								>
									Ana Ribeiro · 4º semestre
								</div>
								<div
									style={{
										marginTop: 10,
										fontFamily: sans,
										fontSize: 34,
										lineHeight: 1.4,
										color: cor.ink2,
									}}
								>
									<span style={{fontFamily: mono, fontWeight: 600, color: cor.ink}}>0h de 120h</span>{' '}
									em saúde mental e nenhum turno escalado até a colação.
								</div>
								<div style={{marginTop: 26, opacity: prog(frame, 64, 78)}}>
									<Botao toque={94}>Escalar em saúde mental</Botao>
								</div>
							</div>
						</Surge>

						<div
							style={{
								height: interpolate(sugestao, [0, 1], [0, 420]),
								overflow: 'hidden',
							}}
						>
							<div
								style={{
									marginTop: 24,
									padding: 32,
									borderRadius: 16,
									backgroundColor: cor.primarySoft,
									opacity: sugestao,
									translate: `0px ${(1 - sugestao) * 40}px`,
								}}
							>
								<div
									style={{
										fontFamily: sans,
										fontWeight: 700,
										fontSize: 26,
										letterSpacing: '0.04em',
										color: cor.primary,
									}}
								>
									SUGESTÃO DA IA
								</div>
								<div
									style={{
										marginTop: 12,
										fontFamily: sans,
										fontSize: 36,
										lineHeight: 1.4,
										color: cor.ink,
									}}
								>
									<span style={{fontFamily: mono, fontWeight: 600}}>20</span> turnos de{' '}
									<span style={{fontFamily: mono, fontWeight: 600}}>6h</span> no CAPS Centro, de{' '}
									<span style={{fontFamily: mono, fontWeight: 600}}>05/03</span> a{' '}
									<span style={{fontFamily: mono, fontWeight: 600}}>30/04</span>.
								</div>
								<div style={{marginTop: 8, fontFamily: sans, fontSize: 30, color: cor.ink2}}>
									Nada muda sem a sua aprovação.
								</div>
								<div style={{marginTop: 24, display: 'flex', gap: 16}}>
									<Botao toque={186}>Aprovar escala</Botao>
									<Botao contorno>Revisar</Botao>
								</div>
							</div>
						</div>
					</div>
				</div>
			</AbsoluteFill>

			<Toque em={94} x={400} y={1066} />
			<Toque em={186} x={321} y={1422} />

			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 150}}>
				<div
					style={{
						width: 900,
						padding: '30px 36px',
						borderRadius: 18,
						backgroundColor: cor.deep,
						color: '#FFFFFF',
						fontFamily: sans,
						fontSize: 34,
						lineHeight: 1.35,
						boxShadow: '0 24px 60px rgba(16,35,31,0.35)',
						opacity: aviso * (1 - avisoSai),
						translate: `0px ${(1 - aviso) * 60}px`,
						display: 'flex',
						gap: 20,
						alignItems: 'flex-start',
					}}
				>
					<div
						style={{
							width: 14,
							alignSelf: 'stretch',
							borderRadius: 7,
							backgroundColor: cor.mint,
						}}
					/>
					<div>
						<b>Escala aprovada: 20 turnos.</b> As horas de saúde mental fecham em{' '}
						<span style={{fontFamily: mono, color: cor.mint}}>30/04</span>.
					</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
