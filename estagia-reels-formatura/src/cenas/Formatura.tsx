import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp} from '../lib/anim';
import {FundoEscuro, Icone, Palavras, Surge} from '../lib/componentes';
import {cor} from '../lib/marca';

export const Formatura: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill>
			<FundoEscuro brilho={interpolate(frame, [0, 40], [0.7, 1.15], clamp)} />
			<AbsoluteFill
				style={{
					justifyContent: 'center',
					alignItems: 'center',
					gap: 50,
					scale: String(interpolate(frame, [0, 90], [1, 1.06])),
				}}
			>
				<Surge em={0} dur={20} y={0} desfoque={0} sai={80}>
					<Icone nome="capelo" tamanho={300} cor={cor.mint} em={2} dur={30} brilho espessura={1.2} />
				</Surge>
				<Palavras
					em={14}
					passo={6}
					tamanho={112}
					sai={80}
					trechos={[{t: 'Aparece na'}, {t: '\n'}, {t: 'formatura.', cor: cor.mint}]}
				/>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
