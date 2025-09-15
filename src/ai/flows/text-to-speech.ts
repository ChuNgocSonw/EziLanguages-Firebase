
'use server';
/**
 * @fileOverview A Genkit flow for text-to-speech conversion.
 *
 * - generateAudio - A function that converts text into audio.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import wav from 'wav';

const GenerateAudioInputSchema = z.string().describe('The text to convert to speech.');
const GenerateAudioOutputSchema = z.object({
    media: z.string().describe("The generated audio as a data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'"),
});

export async function generateAudio(text: string): Promise<z.infer<typeof GenerateAudioOutputSchema>> {
    return generateAudioFlow(text);
}

// Helper function to convert PCM audio data to WAV format
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const generateAudioFlow = ai.defineFlow(
    {
        name: 'generateAudioFlow',
        inputSchema: GenerateAudioInputSchema,
        outputSchema: GenerateAudioOutputSchema,
    },
    async (query) => {
        const { media } = await ai.generate({
            model: googleAI.model('gemini-2.5-flash-preview-tts'),
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Algenib' },
                    },
                },
            },
            prompt: query,
        });

        if (!media) {
            throw new Error('No audio media returned from the AI.');
        }

        const audioBuffer = Buffer.from(
            media.url.substring(media.url.indexOf(',') + 1),
            'base64'
        );
        
        const wavBase64 = await toWav(audioBuffer);

        return {
            media: 'data:audio/wav;base64,' + wavBase64,
        };
    }
);
