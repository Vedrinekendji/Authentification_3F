import { useRef, useState, useEffect } from 'react';

export default function OtpInput({ length = 6, onChange, isPassword = false }) {
  const [values, setValues] = useState(Array(length).fill(''));
  const inputs = useRef([]);

  // On notifie le parent à chaque changement
  useEffect(() => {
    onChange(values.join(''));
  }, [values]);

  const handleChange = (index, e) => {
    const val = e.target.value.slice(-1).replace(/\D/g, ''); // On ne garde que le dernier chiffre
    const newValues = [...values];

    if (!val) {
      if (e.target.value === '') {
        newValues[index] = '';
        setValues(newValues);
      }
      return;
    }

    newValues[index] = val;
    setValues(newValues);

    // Focus sur la case suivante
    if (index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      const newValues = [...values];
      if (!values[index] && index > 0) {
        newValues[index - 1] = '';
        setValues(newValues);
        inputs.current[index - 1]?.focus();
      } else {
        newValues[index] = '';
        setValues(newValues);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length).split('');
    const newValues = [...values];
    pasted.forEach((char, i) => {
      newValues[i] = char;
    });
    setValues(newValues);
    const lastFilled = Math.min(pasted.length, length - 1);
    inputs.current[lastFilled]?.focus();
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type={isPassword ? 'password' : 'text'}
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold bg-slate-50 border-2 rounded-xl transition-all duration-200 outline-none
            ${val ? 'border-[#1e3a8a] bg-white text-[#1e3a8a] shadow-md ring-2 ring-blue-50' : 'border-slate-200 text-slate-400 focus:border-[#1e3a8a] focus:bg-white'}
          `}
        />
      ))}
    </div>
  );
}
