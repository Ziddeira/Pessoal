import React from 'react';
import {Composition, Folder} from 'remotion';
import {Aluna} from './cenas/Aluna';
import {Chamada} from './cenas/Chamada';
import {Consequencias} from './cenas/Consequencias';
import {Formatura} from './cenas/Formatura';
import {Gancho} from './cenas/Gancho';
import {Produto} from './cenas/Produto';
import {Recursos} from './cenas/Recursos';
import {Semestres} from './cenas/Semestres';
import {Virada} from './cenas/Virada';
import timeline from './timeline.json';
import {FormaturaReels} from './Video';

const cenas: Record<string, React.FC> = {
	Gancho,
	Formatura,
	Aluna,
	Consequencias,
	Semestres,
	Produto,
	Recursos,
	Virada,
	Chamada,
};

const total = timeline.cenas.reduce((s, c) => s + c.frames, 0);

export const RemotionRoot: React.FC = () => (
	<>
		<Composition
			id="EstagIA-Formatura"
			component={FormaturaReels}
			width={timeline.width}
			height={timeline.height}
			fps={timeline.fps}
			durationInFrames={total}
		/>
		<Folder name="Cenas">
			{timeline.cenas.map((c) => (
				<Composition
					key={c.id}
					id={c.id}
					component={cenas[c.id]}
					width={timeline.width}
					height={timeline.height}
					fps={timeline.fps}
					durationInFrames={c.frames}
				/>
			))}
		</Folder>
	</>
);
