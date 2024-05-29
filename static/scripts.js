document.addEventListener('DOMContentLoaded', function() {
    const titleDiv = document.getElementById('title');
    const contentDiv = document.getElementById('content');
    const counterDiv = document.getElementById('counter');
    const fullRow = document.getElementById('fullRow');
    const guessForm = document.getElementById('guessForm');
    const guessInput = document.getElementById('guessInput');
    const congratsDiv = document.getElementById('congratsDiv');
    const refreshButton = document.getElementById('refreshButton');
    const reveal = document.getElementById('reveal');
    const finalCount = document.getElementById('compte-final');
    const diss = document.getElementById('diss');
    const presentSpan = document.getElementById('present');

    let counter = 0;
    const dissesBad = ["Mon chien a fait un meilleur score", "lol", "Loser", "J'aurais abandonné à ta place...", "Aie aie aie..."];
    const dissesMedium = ["Pas mal pour un nouveau", "meh", "L'important c'est de participer I guess...", "On peut pas être bon à tout dans la vie hein", "Un peu de pratique et ca va aller"];
    const dissesGood = ["Tricheur", "Pas mal pantoute", "woah", "ok queen", "Enfin quelqu'un à mon niveau!"];

    function fetchRandomArticle() {
        fetch('/random_article')
            .then(response => response.json())
            .then(data => {
                titleDiv.innerHTML = '';
                contentDiv.innerHTML = '';

                const titleFragment = document.createDocumentFragment();
                data.title.forEach(word => {
                    const span = document.createElement('span');
                    span.textContent = word + ' ';
                    if (/\w/.test(word) || word == 'à') {
                        span.classList.add('word');
                    }
                    titleFragment.appendChild(span);
                });
                titleDiv.appendChild(titleFragment);

                const contentFragment = document.createDocumentFragment();
                data.content.forEach(word => {
                    const span = document.createElement('span');
                    span.textContent = word + ' ';
                    if (/\w/.test(word) || word == 'à') {
                        span.classList.add('word');
                    }
                    contentFragment.appendChild(span);
                });
                contentDiv.appendChild(contentFragment);
                guessInput.disabled = false;
            })
            .catch(error => console.error('Error fetching random article:', error));
    }

    function updatePresentSpan(okCount) {
        presentSpan.textContent = okCount === 0 ? '🟥' : '🟩'.repeat(okCount);
    }

    function handleWordClick(event) {
        const wordSpan = event.target;
        if (!wordSpan.classList.contains('guessed')) {
            const originalWord = wordSpan.textContent.trim();
            const originalWidth = wordSpan.offsetWidth;
            wordSpan.textContent = originalWord.length;
            wordSpan.style.width = originalWidth + 'px';
            wordSpan.classList.add('green');
            setTimeout(() => {
                wordSpan.classList.remove('green');
                setTimeout(() => {
                    wordSpan.textContent = originalWord;
                }, 500);
            }, 3000);
        }
    }

    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('word')) {
            handleWordClick(event);
        }
    });

    guessForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const guess = guessInput.value.trim().toLowerCase();

        if (guess) {
            counter++;
            counterDiv.textContent = "Essai #" + counter;

            if(counter < 6) {
                const subRow = document.createElement('div');
                subRow.classList.add('d-flex', 'align-items-center', 'w-50');
                const p = document.createElement('p');
                const n = document.createElement('p');
                p.textContent = guess + ' ';
                n.textContent = counter;
                p.classList.add('past-attempt', 'ms-2');
                n.classList.add('attempt-number', 'me-2');
                fullRow.appendChild(subRow);
                subRow.appendChild(n);
                subRow.appendChild(p);
            }

            const words = Array.from(document.querySelectorAll('.word')).map(span => span.textContent.trim().toLowerCase());

            fetch('/check_guess', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ guess: guess, words_in_article: words })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                const wordSpans = document.querySelectorAll('.word');
                let okCount = 0;
                wordSpans.forEach(wordSpan => {
                    const word = wordSpan.textContent.trim().toLowerCase();
                    if (data.matched_words.includes(word)) {
                        wordSpan.classList.add('guessed');
                        okCount++;
                    }
                });
                updatePresentSpan(okCount);
                
                const spans = titleDiv.querySelectorAll('span');
                const allGuessed = Array.from(spans).every(span => span.classList.contains('guessed'));
                const summ = document.getElementById('summ');

                if (allGuessed) {
                    const summaryContainer = document.querySelector(".summary-container");
                    document.getElementById("summ").style.display = 'none';
                    summaryContainer.classList.add('flipped');
    setTimeout(() => {
  
        document.getElementById("congratsDiv").style.display = 'flex';
        document.getElementById("refreshButton").textContent = "Recommencer";
        document.getElementById("compte-final").textContent = "Réussi en " + counter + " coups";
    }, 600);
        
        
                    reveal.addEventListener('click', function() {
                        document.querySelectorAll('.word').forEach(allSpan => allSpan.classList.add('guessed'));
                    });

                    const dissMessage = counter <= 20 ? dissesGood : counter < 60 ? dissesMedium : dissesBad;
                    diss.textContent = `"${dissMessage[Math.floor(Math.random() * 5)]}"`;
                }
            })
            .catch(error => {
                console.error('Error checking guess:', error);
            });

            guessInput.value = '';
        }
    });

    fetchRandomArticle();

    refreshButton.addEventListener('click', fetchRandomArticle);
});
