// Se bloquea siempre (campo nombre y campo cancion)
const HATE_WORDS = [
  "nazi", "hitler", "heil", "kkk",
  "maricon", "maricones", "travelo", "sidoso",
  "tranny", "faggot", "nigger", "sexo", "ano", "marico", "fag"
];

// Solo se bloquea en el campo nombre (hay canciones con groserias en el titulo)
const PROFANITY_WORDS = [
  "puta", "puto", "putas", "mierda", "coño", "verga", "pendejo",
  "cabron", "gonorrea", "malparido", "hijueputa", "mamaguevo",
  "culo", "pene", "marico"
];

const LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s" };

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[013457@$]/g, (c) => LEET[c] || c)
    .replace(/(.)\1+/g, "$1");
}

const HATE = HATE_WORDS.map(normalize);
const PROFANITY = PROFANITY_WORDS.map(normalize);

function matches(text, list) {
  const norm = normalize(text);
  const tokens = norm.split(/[^a-z]+/).filter(Boolean);
  const squashed = norm.replace(/[^a-z]/g, "");

  return list.some((word) => {
    if (tokens.includes(word)) return true;
    // Detecta "p u t a" o "p.u.t.a" solo para palabras largas
    return word.length >= 5 && squashed.includes(word);
  });
}

export function containsBlocked(text, isName) {
  if (matches(text, HATE)) return true;
  return isName ? matches(text, PROFANITY) : false;
}