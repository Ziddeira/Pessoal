import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FundoEscuro, Pilha} from '../lib/componentes';

export const Recursos: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill>
			<FundoEscuro />
			<AbsoluteFill
				style={{
					justifyContent: 'center',
					alignItems: 'center',
					scale: String(interpolate(frame, [0, 150], [0.97, 1.05])),
				}}
			>
				<Pilha
					em={4}
					passo={18}
					sai={138}
					destaqueUltimo
					itens={[
						'Horas por cenário',
						'Check-in no local',
						'Presença confirmada',
						'Aviso com antecedência',
						'Formatura no tempo certo.',
					]}
				/>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
