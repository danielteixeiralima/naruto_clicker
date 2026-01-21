from PIL import Image
import os

# Tamanho de referência (Sasuke)
REFERENCE_WIDTH = 837
REFERENCE_HEIGHT = 719

# Diretório das imagens
img_dir = "static/img"

# Lista de imagens para verificar
images_to_check = [
    "naruto_face.png",
    "sasuke_face.png",
    "sakura_face.png"
]

# Verificar também os ícones
icon_dir = "static/img/heroes/icons"
icon_files = os.listdir(icon_dir) if os.path.exists(icon_dir) else []

print("=" * 60)
print("ANÁLISE DE DIMENSÕES DAS IMAGENS")
print("=" * 60)
print(f"\nReferência (Sasuke): {REFERENCE_WIDTH}x{REFERENCE_HEIGHT}")
print("\n--- IMAGENS PRINCIPAIS ---")

for img_file in images_to_check:
    img_path = os.path.join(img_dir, img_file)
    if os.path.exists(img_path):
        img = Image.open(img_path)
        width, height = img.size
        
        # Calcular escala necessária
        scale_w = REFERENCE_WIDTH / width
        scale_h = REFERENCE_HEIGHT / height
        scale = min(scale_w, scale_h)  # Usar a menor escala para garantir que cabe
        
        print(f"\n{img_file}:")
        print(f"  Dimensões: {width}x{height}")
        print(f"  Escala sugerida: {scale:.3f} ({scale*100:.1f}%)")
        
        if scale < 1:
            print(f"  ⚠️ MAIOR que referência - precisa zoom OUT")
        elif scale > 1:
            print(f"  ✓ MENOR que referência - precisa zoom IN")
        else:
            print(f"  ✓ IGUAL à referência")

print("\n--- ÍCONES ---")
for icon_file in sorted(icon_files):
    if icon_file.endswith('.png'):
        icon_path = os.path.join(icon_dir, icon_file)
        img = Image.open(icon_path)
        width, height = img.size
        print(f"{icon_file}: {width}x{height}")

print("\n" + "=" * 60)
