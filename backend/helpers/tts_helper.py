import sys
import asyncio
import argparse
import edge_tts

async def generate_tts(text, voice, output_file):
    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_file)
        print(f"SUCCESS: Audio saved to {output_file}")
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ItudeAgent TTS Helper (Edge-TTS)")
    parser.add_argument("--text", type=str, required=True, help="O texto para ser falado")
    parser.add_argument("--voice", type=str, default="pt-BR-FranciscaNeural", help="Voz neural a ser usada (ex: pt-BR-FranciscaNeural)")
    parser.add_argument("--output", type=str, required=True, help="Caminho do arquivo mp3 de saida")
    
    args = parser.parse_args()
    
    asyncio.run(generate_tts(args.text, args.voice, args.output))
