import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FundoEscuro, Palavras} from '../lib/componentes';
import {cor} from '../lib/marca';

export const Gancho: React.FC = () => (
	<AbsoluteFill>
		<FundoEscuro brilho={0.7} />
		<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
			<Palavras
				em={4}
				passo={5}
				tamanho={104}
				sai={78}
				trechos={[
					{t: 'O problema'},
					{t: '\n'},
					{t: 'do estágio'},
					{t: '\n'},
					{t: 'não aparece', cor: 'rgba(255,255,255,0.7)', peso: 500},
					{t: 'hoje.', cor: cor.mint},
				]}
			/>
		</AbsoluteFill>
	</AbsoluteFill>
);
