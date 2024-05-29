from flask import Flask, jsonify, render_template, request
import wikipedia
import re
import random
import spacy
from nltk.corpus import wordnet as wn
import nltk
import os

# Check if NLTK data is already downloaded
nltk_data_path = os.path.expanduser('~') + '/nltk_data'
if not os.path.exists(nltk_data_path + '/corpora/wordnet.zip'):
    nltk.download('wordnet')
if not os.path.exists(nltk_data_path + '/corpora/omw-1.4.zip'):
    nltk.download('omw-1.4')

app = Flask(__name__)

nlp = spacy.load('fr_core_news_sm')

# for MVP, to avoid bad article selection, a list of vital articles serves as DB
def read_vital_articles():
    with open('vital_articles.txt', 'r') as file:
        return [line.strip() for line in file]

vital_articles = read_vital_articles()

MAX_WORDS = 500

lemmatize_cache = {}
synonyms_cache = {}

def lemmatize(word):
    if word not in lemmatize_cache:
        doc = nlp(word)
        lemmatize_cache[word] = doc[0].lemma_
    return lemmatize_cache[word]

def get_synonyms(word):
    if word not in synonyms_cache:
        synonyms = set()
        for synset in wn.synsets(word):
            for lemma in synset.lemmas():
                synonyms.add(lemma.name())
        synonyms_cache[word] = synonyms
    return synonyms_cache[word]

@app.route('/')
def index():
    return render_template('random_wikipedia_article.html')

@app.route('/random_article')
def random_article():
    try:
        wikipedia.set_lang("fr")
        title = random.choice(vital_articles)
        content = wikipedia.page(title).content
        content = re.sub(r'=+[^=]+?=+', '', content)
        title = re.sub(r'=+[^=]+?=+', '', title)
        title_words = re.findall(r'\w+|\S', title)
        content_words = re.findall(r'\w+|\S', content)
        limited_content_words = content_words[:MAX_WORDS]

        last_period_index = len(limited_content_words) - 1
        for i in range(last_period_index, -1, -1):
            if '.' in limited_content_words[i]:
                last_period_index = i
                break

        limited_content_words = limited_content_words[:last_period_index + 1]

        return jsonify({'title': title_words, 'content': limited_content_words})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/check_guess', methods=['POST'])
def check_guess():
    try:
        data = request.get_json()
        guess = data['guess']
        words_in_article = data['words_in_article']

        lemmatized_guess = lemmatize(guess)
        synonyms = get_synonyms(lemmatized_guess)

        matched_words = [
            word for word in words_in_article
            if lemmatize(word) == lemmatized_guess or word in synonyms
        ]

        return jsonify({"matched_words": matched_words})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
