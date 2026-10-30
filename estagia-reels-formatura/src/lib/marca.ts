import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Manual da marca EstagIA 1.0: só Plus Jakarta Sans e JetBrains Mono.
// Arquivos variáveis do Google Fonts (licença OFL) em public/fonts, para o
// render funcionar sem internet.
export const sans = 'Plus Jakarta Sans';
export const mono = 'JetBrains Mono';

loadFont({family: sans, url: staticFile('fonts/PlusJakartaSans.woff2'), weight: '400 700'});
loadFont({family: mono, url: staticFile('fonts/JetBrainsMono.woff2'), weight: '500 600'});

// Paleta oficial (seção 05 do manual).
export const cor = {
	deep: '#10231F',
	deep2: '#18332D',
	mint: '#7FD1C1',
	primary: '#0E5A52',
	primarySoft: '#E3EFEC',
	page: '#F4F5F2',
	surface: '#FFFFFF',
	ink: '#16201D',
	ink2: '#3A4642',
	muted: '#55625D',
	line: '#DDE2DE',
	lineStrong: '#85918B',
};

// Cada status tem par de fundo e texto e sempre aparece com uma palavra.
export const status = {
	emDia: {bg: '#E2F1E6', fg: '#1D5B33'},
	atencao: {bg: '#FBEBDD', fg: '#8A4210'},
	bloqueio: {bg: '#FBE4E1', fg: '#A1261C'},
	hoje: {bg: '#EAF0F8', fg: '#1F4A7A'},
	agendado: {bg: '#EEF1EE', fg: '#3A4642'},
	ficticio: {bg: '#FCF1D6', fg: '#6B4A00'},
} as const;

export type Status = keyof typeof status;
