from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

user_data = {}

@app.route('/')
def index():
    return render_template('index.html')  # Sirve la página HTML con el chat

@app.route('/funnel', methods=['POST'])
def funnel():
    user_message = request.json.get('message')

    if 'name' not in user_data:
        user_data['name'] = user_message
        return jsonify({
            'message': f"Hola, {user_data['name']}! ¿Cuál es tu correo electrónico?"
        })
    elif 'email' not in user_data:
        user_data['email'] = user_message
        return jsonify({
            'message': f"Gracias, {user_data['name']}! Tu correo electrónico es {user_data['email']}. ¿En qué podemos ayudarte?"
        })
    else:
        return jsonify({
            'message': "¡Gracias por completar el funnel! ¿Algo más en lo que te pueda ayudar?"
        })

if __name__ == '__main__':
    app.run(debug=True)