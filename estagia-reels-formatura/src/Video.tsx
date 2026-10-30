import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Series, staticFile} from 'remotion';
import {Aluna} from './cenas/Aluna';
import {Chamada} from './cenas/Chamada';
import {Consequencias} from './cenas/Consequencias';
import {Formatura} from './cenas/Formatura';
import {Gancho} from './cenas/Gancho';
import {Produto} from './cenas/Produto';
import {Recursos} from './cenas/Recursos';
import {Semestres} from './cenas/Semestres';
import {Virada} from './cenas/Virada';

// As durações precisam bater com src/timeline.json, que também guia a trilha.
export const FormaturaReels: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: '#10231F'}}>
		<Series>
			<Series.Sequence name="Gancho" durationInFrames={90}>
				<Gancho />
			</Series.Sequence>
			<Series.Sequence name="Formatura" durationInFrames={90}>
				<Formatura />
			</Series.Sequence>
			<Series.Sequence name="Aluna" durationInFrames={240}>
				<Aluna />
			</Series.Sequence>
			<Series.Sequence name="Consequencias" durationInFrames={180}>
				<Consequencias />
			</Series.Sequence>
			<Series.Sequence name="Semestres" durationInFrames={150}>
				<Semestres />
			</Series.Sequence>
			<Series.Sequence name="Produto" durationInFrames={300}>
				<Produto />
			</Series.Sequence>
			<Series.Sequence name="Recursos" durationInFrames={150}>
				<Recursos />
			</Series.Sequence>
			<Series.Sequence name="Virada" durationInFrames={120}>
				<Virada />
			</Series.Sequence>
			<Series.Sequence name="Chamada" durationInFrames={150}>
				<Chamada />
			</Series.Sequence>
		</Series>
		<Audio src={staticFile('trilha.wav')} />
	</AbsoluteFill>
);
