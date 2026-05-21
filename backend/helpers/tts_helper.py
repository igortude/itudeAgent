import os
import sys
import asyncio
import argparse
import urllib.request
import edge_tts

# Caminhos de cache para o Kokoro Offline
KOKORO_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "kokoro")
MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/kokoro-v0_19.onnx"
VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/voices.bin"

MODEL_PATH = os.path.join(KOKORO_DIR, "kokoro-v0_19.onnx")
VOICES_PATH = os.path.join(KOKORO_DIR, "voices.bin")

def download_file(url, dest_path):
    """Garante o download progressivo resiliente de arquivos grandes."""
    if os.path.exists(dest_path):
        return True
    
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    print(f"BAIXANDO: {os.path.basename(dest_path)} de {url}...")
    
    try:
        def progress_hook(count, block_size, total_size):
            percent = int(count * block_size * 100 / total_size)
            sys.stdout.write(f"\rProgresso de download: {percent}%")
            sys.stdout.flush()

        urllib.request.urlretrieve(url, dest_path, progress_hook)
        print(f"\nDOWNLOAD CONCLUÍDO: {dest_path}")
        return True
    except Exception as e:
        print(f"\nERRO AO BAIXAR: {str(e)}", file=sys.stderr)
        if os.path.exists(dest_path):
            os.remove(dest_path)
        return False

def generate_kokoro(text, voice_id, output_file):
    """Gera síntese offline ultra avançada via Kokoro ONNX."""
    # Baixar os arquivos necessários se não existirem
    if not download_file(MODEL_URL, MODEL_PATH) or not download_file(VOICES_URL, VOICES_PATH):
        raise Exception("Não foi possível baixar os modelos ONNX do Kokoro. Usando fallback.")

    # Mapeamento do nome da voz do Kokoro
    voice_name = voice_id.replace("kokoro-", "")
    
    from kokoro_onnx import KokoroOnnx
    import soundfile as sf

    print(f"Inicializando Kokoro ONNX com a voz: '{voice_name}'...")
    kokoro = KokoroOnnx(MODEL_PATH, VOICES_PATH)
    
    # Gerar o áudio (Retorna sample_rate e dados do áudio)
    # Bella, Sarah, Michael, etc.
    samples, sample_rate = kokoro.create(text, voice=voice_name, speed=1.0, lang="en-us")
    
    # Salvar em wav/mp3 temporário usando soundfile
    sf.write(output_file, samples, sample_rate)
    print(f"SUCCESS: Kokoro Audio salvo em {output_file}")

async def generate_edge(text, voice, output_file):
    """Gera síntese altamente realista em PT-BR online via Edge-TTS."""
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_file)
    print(f"SUCCESS: Edge-TTS Audio salvo em {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ItudeAgent TTS Helper (Hybrid Kokoro & Edge)")
    parser.add_argument("--text", type=str, required=True, help="Texto para sintetizar")
    parser.add_argument("--voice", type=str, default="pt-BR-FranciscaNeural", help="ID da Voz (ex: pt-BR-FranciscaNeural ou kokoro-bella)")
    parser.add_argument("--output", type=str, required=True, help="Caminho completo de saída mp3/wav")
    
    args = parser.parse_args()
    
    # Seleção híbrida de motor de voz
    if args.voice.startswith("kokoro-"):
        try:
            generate_kokoro(args.text, args.voice, args.output)
        except Exception as e:
            print(f"WARNING: Kokoro falhou ({str(e)}). Fazendo fallback para Edge-TTS...", file=sys.stderr)
            # Fallback resiliente automático
            fallback_voice = "pt-BR-FranciscaNeural"
            asyncio.run(generate_edge(args.text, fallback_voice, args.output))
    else:
        try:
            asyncio.run(generate_edge(args.text, args.voice, args.output))
        except Exception as e:
            print(f"ERROR: Edge-TTS falhou ({str(e)})", file=sys.stderr)
            sys.exit(1)
