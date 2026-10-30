import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FundoEscuro, LinhaSemestres, Palavras, Surge} from '../lib/componentes';
import {cor} from '../lib/marca';

export const Semestres: React.FC = () => (
	<AbsoluteFill>
		<FundoEscuro brilho={0.85} />
		<AbsoluteFill style={{alignItems: 'center', paddingTop: 380}}>
			<Palavras
				em={4}
				passo={4}
				tamanho={88}
				sai={140}
				trechos={[
					{t: 'Hoje, a conta'},
					{t: '\n'},
					{t: 'só é feita no', cor: 'rgba(255,255,255,0.75)', peso: 500},
					{t: '\n'},
					{t: 'último semestre.', cor: cor.mint},
				]}
			/>
		</AbsoluteFill>
		<AbsoluteFill style={{alignItems: 'center', paddingTop: 1040}}>
			<Surge em={20} y={0} desfoque={0} sai={140}>
				<LinhaSemestres em={24} marcador={7} escuro marcadorEm={58} rotulo="aqui" />
			</Surge>
		</AbsoluteFill>
		<AbsoluteFill style={{alignItems: 'center', paddingTop: 1390}}>
			<Palavras
				em={84}
				passo={4}
				tamanho={56}
				peso={500}
				sai={140}
				corBase="rgba(255,255,255,0.85)"
				trechos={[{t: 'Sem tempo para escalar'}, {t: '80h.', cor: cor.mint, peso: 700}]}
			/>
		</AbsoluteFill>
	</AbsoluteFill>
);
