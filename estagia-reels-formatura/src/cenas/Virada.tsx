import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, easeInOut} from '../lib/anim';
import {FundoClaro, LinhaSemestres, Palavras, Surge} from '../lib/componentes';
import {cor} from '../lib/marca';

export const Virada: React.FC = () => {
	const frame = useCurrentFrame();
	const marcador = interpolate(frame, [26, 60], [7, 3], {...clamp, easing: easeInOut});
	return (
		<AbsoluteFill>
			<FundoClaro />
			<AbsoluteFill style={{alignItems: 'center', paddingTop: 560}}>
				<Palavras
					em={52}
					passo={5}
					tamanho={104}
					corBase={cor.ink}
					sai={110}
					trechos={[{t: 'No 4º semestre.', cor: cor.primary}, {t: '\n'}, {t: 'Não no último.'}]}
				/>
			</AbsoluteFill>
			<AbsoluteFill style={{alignItems: 'center', paddingTop: 1060}}>
				<Surge em={0} y={0} desfoque={0} sai={110}>
					<LinhaSemestres em={0} marcador={marcador} escuro={false} marcadorEm={10} />
				</Surge>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
