from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__)

# Desabilitar cache completamente
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['TEMPLATES_AUTO_RELOAD'] = True

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    print("\n" + "="*60)
    print("NARUTO CLICKER - Servidor Iniciado!")
    print("="*60)
    print("Acesse: http://localhost:8080")
    print("Cache desabilitado - mudancas aparecem imediatamente")
    print("Pressione Ctrl+C para parar o servidor")
    print("="*60 + "\n")
    app.run(debug=True, port=8080, host='0.0.0.0')
