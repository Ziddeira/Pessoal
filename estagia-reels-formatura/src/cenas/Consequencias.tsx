import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FundoEscuro, Palavras, Pilha, Surge} from '../lib/componentes';
import {cor, sans} from '../lib/marca';

export const Consequencias: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill>
			<FundoEscuro />
			<AbsoluteFill style={{alignItems: 'center', paddingTop: 300}}>
				<Surge em={2} sai={116}>
					<div
						style={{
							fontFamily: sans,
							fontWeight: 500,
							fontSize: 52,
							color: 'rgba(255,255,255,0.75)',
							textAlign: 'center',
						}}
					>
						A 3 meses da colação:
					</div>
				</Surge>
			</AbsoluteFill>
			<AbsoluteFill
				style={{
					justifyContent: 'center',
					alignItems: 'center',
					scale: String(interpolate(frame, [0, 130], [0.96, 1.04])),
				}}
			>
				<Pilha
					em={14}
					passo={20}
					sai={116}
					itens={['Colação adiada', 'Família cobrando o polo', 'Turno extra às pressas', 'Convênio desgastado']}
				/>
			</AbsoluteFill>
			<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
				<Palavras
					em={128}
					passo={5}
					tamanho={100}
					trechos={[{t: 'E quem responde'}, {t: '\n'}, {t: 'é o polo.', cor: cor.mint}]}
				/>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
