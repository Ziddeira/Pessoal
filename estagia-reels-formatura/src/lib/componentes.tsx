import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, easeIn, easeOut, prog} from './anim';
import {cor, mono, sans, status, Status} from './marca';

// Fundo verde-escuro com brilho de ação e grade bem sutil em menta.
export const FundoEscuro: React.FC<{brilho?: number; grade?: number}> = ({
	brilho = 1,
	grade = 1,
}) => {
	const frame = useCurrentFrame();
	const gx = 50 + Math.sin(frame / 70) * 14;
	const gy = 78 + Math.cos(frame / 90) * 8;
	return (
		<AbsoluteFill style={{backgroundColor: cor.deep}}>
			<AbsoluteFill
				style={{
					opacity: brilho,
					background: `radial-gradient(85% 55% at ${gx}% ${gy}%, rgba(14,90,82,0.85) 0%, rgba(24,51,45,0.55) 45%, rgba(16,35,31,0) 75%)`,
				}}
			/>
			<AbsoluteFill
				style={{
					opacity: 0.07 * grade,
					backgroundImage: `linear-gradient(${cor.mint} 1px, transparent 1px), linear-gradient(90deg, ${cor.mint} 1px, transparent 1px)`,
					backgroundSize: '96px 96px',
					backgroundPosition: `0px ${frame * 0.6}px`,
					maskImage:
						'radial-gradient(70% 60% at 50% 55%, black 0%, transparent 85%)',
				}}
			/>
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(120% 90% at 50% 50%, rgba(16,35,31,0) 55%, rgba(16,35,31,0.9) 100%)',
				}}
			/>
		</AbsoluteFill>
	);
};

// Fundo claro da interface (page) com um toque de verde-claro.
export const FundoClaro: React.FC = () => {
	const frame = useCurrentFrame();
	const gx = 30 + Math.sin(frame / 80) * 20;
	return (
		<AbsoluteFill
			style={{
				backgroundColor: cor.page,
				background: `radial-gradient(90% 60% at ${gx}% 15%, ${cor.primarySoft} 0%, ${cor.page} 70%)`,
			}}
		/>
	);
};

// Entrada com desfoque e subida; saída com desfoque.
export const Surge: React.FC<{
	em: number;
	dur?: number;
	y?: number;
	desfoque?: number;
	sai?: number;
	saiDur?: number;
	escala?: number;
	style?: React.CSSProperties;
	children: React.ReactNode;
}> = ({em, dur = 16, y = 36, desfoque = 18, sai, saiDur = 10, escala = 0.96, style, children}) => {
	const frame = useCurrentFrame();
	const p = prog(frame, em, em + dur);
	const s = sai === undefined ? 0 : prog(frame, sai, sai + saiDur, easeIn);
	return (
		<div
			style={{
				opacity: p * (1 - s),
				filter: `blur(${(1 - p) * desfoque + s * desfoque}px)`,
				translate: `0px ${(1 - p) * y - s * y * 0.6}px`,
				scale: String(interpolate(p, [0, 1], [escala, 1]) + s * 0.04),
				...style,
			}}
		>
			{children}
		</div>
	);
};

export type Trecho = {t: string; cor?: string; peso?: number};

// Tipografia cinética: cada palavra entra separada, como no vídeo de referência.
export const Palavras: React.FC<{
	trechos: Trecho[];
	em: number;
	passo?: number;
	tamanho?: number;
	corBase?: string;
	peso?: number;
	sai?: number;
	alinhar?: 'center' | 'left';
	largura?: number;
	style?: React.CSSProperties;
}> = ({
	trechos,
	em,
	passo = 4,
	tamanho = 96,
	corBase = '#FFFFFF',
	peso = 700,
	sai,
	alinhar = 'center',
	largura = 900,
	style,
}) => {
	const palavras = trechos.flatMap((tr) =>
		tr.t === '\n'
			? [{p: '\n', cor: undefined, peso: undefined}]
			: tr.t.split(' ').map((p) => ({p, cor: tr.cor, peso: tr.peso})),
	);
	let i = 0;
	return (
		<div
			style={{
				fontFamily: sans,
				fontSize: tamanho,
				lineHeight: 1.08,
				letterSpacing: '-0.025em',
				color: corBase,
				fontWeight: peso,
				textAlign: alinhar,
				width: largura,
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: alinhar === 'center' ? 'center' : 'flex-start',
				columnGap: tamanho * 0.26,
				...style,
			}}
		>
			{palavras.map((w, k) => {
				if (w.p === '\n') {
					return <div key={k} style={{flexBasis: '100%', height: 0}} />;
				}
				const atraso = em + i * passo;
				i++;
				return (
					<Surge key={k} em={atraso} dur={14} y={tamanho * 0.35} sai={sai}>
						<span style={{color: w.cor ?? corBase, fontWeight: w.peso ?? peso}}>
							{w.p}
						</span>
					</Surge>
				);
			})}
		</div>
	);
};

export const Selo: React.FC<{tipo: Status; children: React.ReactNode; tamanho?: number}> = ({
	tipo,
	children,
	tamanho = 26,
}) => (
	<div
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: 10,
			padding: `${tamanho * 0.3}px ${tamanho * 0.62}px`,
			borderRadius: 10,
			backgroundColor: status[tipo].bg,
			color: status[tipo].fg,
			fontFamily: sans,
			fontWeight: 700,
			fontSize: tamanho,
			lineHeight: 1,
			whiteSpace: 'nowrap',
		}}
	>
		{children}
	</div>
);

// Ícones de traço com pontas arredondadas, desenhados progressivamente.
const Traco: React.FC<{
	d: string[];
	tamanho: number;
	cor: string;
	progresso: number;
	espessura?: number;
	brilho?: boolean;
}> = ({d, tamanho, cor: c, progresso, espessura = 1.6, brilho}) => (
	<svg
		width={tamanho}
		height={tamanho}
		viewBox="0 0 24 24"
		fill="none"
		style={{
			overflow: 'visible',
			filter: brilho ? `drop-shadow(0 0 18px ${c}) drop-shadow(0 0 4px ${c})` : undefined,
		}}
	>
		{d.map((p, k) => (
			<path
				key={k}
				d={p}
				pathLength={1}
				stroke={c}
				strokeWidth={espessura}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeDasharray={1}
				strokeDashoffset={1 - progresso}
			/>
		))}
	</svg>
);

// Formas inspiradas no conjunto Lucide (licença ISC).
export const icones = {
	capelo: [
		'M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z',
		'M22 10v6',
		'M6 12.5V16a6 3 0 0 0 12 0v-3.5',
	],
	relogio: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18', 'M12 7v5l3 2'],
	alfinete: [
		'M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0',
		'M12 7a3 3 0 1 0 0 6a3 3 0 1 0 0-6',
	],
	visto: ['M20 6 9 17l-5-5'],
	sino: [
		'M10.27 21a2 2 0 0 0 3.46 0',
		'M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33',
	],
	camadas: [
		'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z',
		'M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12',
		'M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17',
	],
};

export const Icone: React.FC<{
	nome: keyof typeof icones;
	tamanho: number;
	cor: string;
	em: number;
	dur?: number;
	brilho?: boolean;
	espessura?: number;
}> = ({nome, tamanho, cor: c, em, dur = 24, brilho, espessura}) => {
	const frame = useCurrentFrame();
	return (
		<Traco
			d={icones[nome]}
			tamanho={tamanho}
			cor={c}
			progresso={prog(frame, em, em + dur)}
			brilho={brilho}
			espessura={espessura}
		/>
	);
};

// Linha dos 8 semestres do curso, com um marcador que pode andar entre eles.
export const LinhaSemestres: React.FC<{
	em: number;
	marcador: number;
	escuro: boolean;
	largura?: number;
	rotulo?: string;
	marcadorEm?: number;
}> = ({em, marcador, escuro, largura = 880, rotulo, marcadorEm}) => {
	const frame = useCurrentFrame();
	const desenho = prog(frame, em, em + 30);
	const corLinha = escuro ? 'rgba(127,209,193,0.35)' : cor.line;
	const corPonto = escuro ? cor.mint : cor.primary;
	const passo = largura / 7;
	const mEm = marcadorEm ?? em + 30;
	const mAparece = prog(frame, mEm, mEm + 14);
	return (
		<div style={{position: 'relative', width: largura, height: 220}}>
			<div
				style={{
					position: 'absolute',
					top: 60,
					left: 0,
					height: 4,
					borderRadius: 2,
					width: largura * desenho,
					backgroundColor: corLinha,
				}}
			/>
			{Array.from({length: 8}).map((_, k) => {
				const p = prog(frame, em + k * 3, em + k * 3 + 14);
				const ativo = Math.abs(marcador - k) < 0.5;
				return (
					<div
						key={k}
						style={{
							position: 'absolute',
							left: k * passo - 50,
							top: 0,
							width: 100,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							opacity: p,
							translate: `0px ${(1 - p) * 20}px`,
						}}
					>
						<div
							style={{
								marginTop: 48,
								width: 28,
								height: 28,
								borderRadius: 14,
								backgroundColor: escuro ? cor.deep : cor.surface,
								border: `4px solid ${ativo && mAparece > 0.5 ? corPonto : corLinha}`,
							}}
						/>
						<div
							style={{
								marginTop: 18,
								fontFamily: mono,
								fontWeight: 600,
								fontSize: 34,
								color: ativo && mAparece > 0.5
									? corPonto
									: escuro
										? 'rgba(255,255,255,0.55)'
										: cor.muted,
							}}
						>
							{k + 1}º
						</div>
					</div>
				);
			})}
			<div
				style={{
					position: 'absolute',
					left: marcador * passo - 34,
					top: 28,
					width: 68,
					height: 68,
					borderRadius: 34,
					border: `3px solid ${corPonto}`,
					opacity: mAparece,
					scale: String(interpolate(mAparece, [0, 1], [1.8, 1])),
					boxShadow: escuro ? `0 0 34px ${cor.mint}` : 'none',
				}}
			/>
			{rotulo ? (
				<div
					style={{
						position: 'absolute',
						left: marcador * passo - 160,
						top: -70,
						width: 320,
						textAlign: 'center',
						fontFamily: sans,
						fontWeight: 600,
						fontSize: 36,
						color: corPonto,
						opacity: mAparece,
					}}
				>
					{rotulo}
				</div>
			) : null}
		</div>
	);
};

// Itens empilhados em perspectiva, no estilo da lista "Atende na hora / Qualifica".
export const Pilha: React.FC<{
	itens: string[];
	em: number;
	passo: number;
	destaqueUltimo?: boolean;
	sai?: number;
}> = ({itens, em, passo, destaqueUltimo, sai}) => {
	const frame = useCurrentFrame();
	const giro = interpolate(frame, [em, em + itens.length * passo + 40], [-20, -10], clamp);
	const saida = sai === undefined ? 0 : prog(frame, sai, sai + 14, easeIn);
	return (
		<div style={{perspective: 1600}}>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 34,
					rotate: `x 12deg`,
					transform: `rotateY(${giro}deg)`,
					transformStyle: 'preserve-3d',
					opacity: 1 - saida,
					filter: `blur(${saida * 20}px)`,
				}}
			>
				{itens.map((t, k) => {
					const a = em + k * passo;
					const p = prog(frame, a, a + 16);
					const ultimo = destaqueUltimo && k === itens.length - 1;
					return (
						<div
							key={t}
							style={{
								opacity: p,
								filter: `blur(${(1 - p) * 14}px)`,
								translate: `${(1 - p) * 220}px 0px`,
								padding: '30px 52px',
								borderRadius: 18,
								border: `2px solid ${ultimo ? cor.mint : 'rgba(127,209,193,0.45)'}`,
								backgroundColor: ultimo ? cor.mint : 'rgba(24,51,45,0.75)',
								color: ultimo ? cor.deep : '#FFFFFF',
								fontFamily: sans,
								fontWeight: 600,
								fontSize: 58,
								letterSpacing: '-0.02em',
								boxShadow: ultimo
									? `0 0 60px rgba(127,209,193,0.45)`
									: '0 0 30px rgba(127,209,193,0.12)',
								whiteSpace: 'nowrap',
							}}
						>
							{t}
						</div>
					);
				})}
			</div>
		</div>
	);
};

// Contador numérico em mono (para horas).
export const Contador: React.FC<{
	de: number;
	ate: number;
	em: number;
	dur: number;
	sufixo?: string;
	style?: React.CSSProperties;
}> = ({de, ate, em, dur, sufixo = 'h', style}) => {
	const frame = useCurrentFrame();
	const v = Math.round(interpolate(frame, [em, em + dur], [de, ate], {...clamp, easing: easeOut}));
	return (
		<span style={{fontFamily: mono, fontWeight: 600, ...style}}>
			{v.toLocaleString('pt-BR')}
			{sufixo}
		</span>
	);
};
