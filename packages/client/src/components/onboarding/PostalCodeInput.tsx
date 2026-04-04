import { useState } from 'react';

interface ProfileData {
  postalCode: string;
  infoSource: string;
  perceivedBias: string;
}

interface PostalCodeInputProps {
  onSubmit: (data: ProfileData) => void;
}

const INFO_SOURCES = [
  { value: 'tv', label: 'Télévision', desc: 'JT, chaînes info (TF1, BFM, CNews...)' },
  { value: 'internet', label: 'Internet / Réseaux sociaux', desc: 'X, TikTok, Facebook, YouTube...' },
  { value: 'radio', label: 'Radio', desc: 'France Inter, RTL, Europe 1...' },
  { value: 'journal', label: 'Presse écrite / web', desc: 'Le Monde, Le Figaro, Mediapart...' },
  { value: 'autre', label: 'Autre / Pas de source principale', desc: '' },
];

const PERCEIVED_BIASES = [
  { value: 'gauche', label: 'Plutôt de gauche' },
  { value: 'droite', label: 'Plutôt de droite' },
  { value: 'neutre', label: 'Neutres / objectives' },
  { value: 'les_deux', label: 'Je varie les sources' },
];

export function PostalCodeInput({ onSubmit }: PostalCodeInputProps) {
  const [step, setStep] = useState<'postal' | 'source' | 'bias'>('postal');
  const [postalCode, setPostalCode] = useState('');
  const [infoSource, setInfoSource] = useState('');
  const [perceivedBias, setPerceivedBias] = useState('');
  const [error, setError] = useState('');

  const validatePostal = (val: string) => /^\d{5}$/.test(val);

  const handlePostalNext = () => {
    if (!validatePostal(postalCode)) {
      setError('Entre un code postal à 5 chiffres (ou 00000 si tu es à l\'étranger)');
      return;
    }
    setStep('source');
  };

  // Step indicator
  const stepIndex = step === 'postal' ? 0 : step === 'source' ? 1 : 2;

  if (step === 'postal') {
    return (
      <section className="max-w-md mx-auto text-center" aria-label="Code postal">
        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-6" role="progressbar" aria-valuenow={1} aria-valuemin={1} aria-valuemax={3} aria-label="Étape 1 sur 3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1 rounded-full transition-all ${i <= stepIndex ? 'bg-purple-600 w-8' : 'bg-gray-800 w-6'}`} />
          ))}
        </div>

        <h2 className="text-xl sm:text-2xl font-bold mb-2">Avant de commencer</h2>
        <p className="text-gray-400 mb-6 text-sm sm:text-base">
          Quelques infos pour enrichir l'analyse. Tout est anonyme.
        </p>

        <div className="flex flex-col gap-3 items-center">
          <label htmlFor="postal-code" className="text-sm text-gray-400">Ton code postal</label>
          <input
            id="postal-code"
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="Ex : 75011"
            value={postalCode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 5);
              setPostalCode(val);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handlePostalNext()}
            className="w-40 text-center text-2xl tracking-widest bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none"
            aria-describedby={error ? 'postal-error' : undefined}
            aria-invalid={error ? 'true' : undefined}
            autoComplete="postal-code"
          />
          {error && <p id="postal-error" className="text-red-400 text-sm" role="alert">{error}</p>}

          <button
            onClick={handlePostalNext}
            disabled={postalCode.length < 5}
            className="mt-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition-colors touch-target focus-ring"
          >
            Continuer
          </button>

          <button
            onClick={() => { setPostalCode('00000'); setStep('source'); }}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors py-2 focus-ring rounded"
          >
            Je suis à l'étranger / Je préfère ne pas donner
          </button>
        </div>
      </section>
    );
  }

  if (step === 'source') {
    return (
      <section className="max-w-md mx-auto" aria-label="Source d'information">
        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-6" role="progressbar" aria-valuenow={2} aria-valuemin={1} aria-valuemax={3} aria-label="Étape 2 sur 3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1 rounded-full transition-all ${i <= stepIndex ? 'bg-purple-600 w-8' : 'bg-gray-800 w-6'}`} />
          ))}
        </div>

        <h2 className="text-lg sm:text-xl font-bold mb-2 text-center">Ta source d'info principale</h2>
        <p className="text-gray-400 text-sm mb-6 text-center">
          Quelle est ta principale source d'information sur l'actualité ?
        </p>

        <ul className="flex flex-col gap-2" role="list">
          {INFO_SOURCES.map((s) => (
            <li key={s.value}>
              <button
                onClick={() => { setInfoSource(s.value); setStep('bias'); }}
                className="w-full text-left p-3 sm:p-4 rounded-lg border border-gray-800 bg-gray-900 hover:border-purple-600 transition-colors touch-target focus-ring"
              >
                <span className="font-medium">{s.label}</span>
                {s.desc && <span className="text-sm text-gray-500 block sm:inline sm:ml-2">{s.desc}</span>}
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // step === 'bias'
  return (
    <section className="max-w-md mx-auto" aria-label="Biais perçu">
      {/* Step indicator */}
      <div className="flex justify-center gap-2 mb-6" role="progressbar" aria-valuenow={3} aria-valuemin={1} aria-valuemax={3} aria-label="Étape 3 sur 3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 rounded-full transition-all ${i <= stepIndex ? 'bg-purple-600 w-8' : 'bg-gray-800 w-6'}`} />
        ))}
      </div>

      <h2 className="text-lg sm:text-xl font-bold mb-2 text-center">Tes sources sont plutôt...</h2>
      <p className="text-gray-400 text-sm mb-6 text-center">
        Selon toi, tes principales sources d'information sont :
      </p>

      <ul className="flex flex-col gap-2" role="list">
        {PERCEIVED_BIASES.map((b) => (
          <li key={b.value}>
            <button
              onClick={() => {
                setPerceivedBias(b.value);
                onSubmit({ postalCode, infoSource, perceivedBias: b.value });
              }}
              className="w-full text-left p-3 sm:p-4 rounded-lg border border-gray-800 bg-gray-900 hover:border-purple-600 transition-colors font-medium touch-target focus-ring"
            >
              {b.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
