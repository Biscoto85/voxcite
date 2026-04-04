import { useState } from 'react';

interface PostalCodeInputProps {
  onSubmit: (postalCode: string) => void;
}

export function PostalCodeInput({ onSubmit }: PostalCodeInputProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const validate = (val: string) => /^\d{5}$/.test(val);

  const handleSubmit = () => {
    if (!validate(code)) {
      setError('Entre un code postal à 5 chiffres (ou 00000 si tu es à l\'étranger)');
      return;
    }
    onSubmit(code);
  };

  return (
    <div className="max-w-md mx-auto text-center">
      <h2 className="text-2xl font-bold mb-2">Avant de commencer</h2>
      <p className="text-gray-400 mb-6">
        Ton code postal nous permet d'enrichir les analyses (urbain vs rural, régions).
        Tes réponses restent 100% anonymes.
      </p>

      <div className="flex flex-col gap-3 items-center">
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          placeholder="Ex : 75011"
          value={code}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 5);
            setCode(val);
            setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="w-40 text-center text-2xl tracking-widest bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={code.length < 5}
          className="mt-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition-colors"
        >
          C'est parti
        </button>

        <button
          onClick={() => onSubmit('00000')}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          Je suis à l'étranger / Je préfère ne pas donner
        </button>
      </div>
    </div>
  );
}
