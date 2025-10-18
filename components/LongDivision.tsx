import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import Block from './Block';
import BlockGrid from './BlockGrid';
import StepCard from './StepCard';

interface LongDivisionProps {
  dividend: number;
  divisor: number;
  onComplete?: () => void;
}

const LongDivisionInput: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isWrong: boolean;
  maxLength: number;
  className?: string;
  autoFocus?: boolean;
  onEnterPress: () => void;
}> = ({ value, onChange, isWrong, maxLength, className = 'w-12', autoFocus = false, onEnterPress }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if(autoFocus && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnterPress();
    }
  };

  return (
    <input
      ref={inputRef}
      type="number"
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      maxLength={maxLength}
      className={`${className} h-12 text-center bg-yellow-50 border-2 rounded-md text-2xl sm:text-3xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
        isWrong ? 'border-red-500 animate-shake' : 'border-sky-400'
      }`}
      onFocus={(e) => e.target.select()}
    />
  );
};

const SplitLongDivisionInput: React.FC<{
  tensValue: string;
  onesValue: string;
  onTensChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOnesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isWrong: boolean;
  onEnterPress: () => void;
}> = ({ tensValue, onesValue, onTensChange, onOnesChange, isWrong, onEnterPress }) => {
  const tensInputRef = useRef<HTMLInputElement>(null);
  const onesInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    tensInputRef.current?.focus();
  }, []);

  const handleTensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTensChange(e);
    if (e.target.value.length === 1) {
      onesInputRef.current?.focus();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnterPress();
    }
  };

  return (
    <div className="flex">
      <input
        ref={tensInputRef}
        type="number"
        value={tensValue}
        onChange={handleTensChange}
        onKeyDown={handleKeyDown}
        maxLength={1}
        className={`w-12 h-12 text-center bg-yellow-50 border-2 rounded-l-md text-2xl sm:text-3xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
          isWrong ? 'border-red-500 animate-shake' : 'border-sky-400'
        }`}
        onFocus={(e) => e.target.select()}
      />
      <input
        ref={onesInputRef}
        type="number"
        value={onesValue}
        onChange={onOnesChange}
        onKeyDown={handleKeyDown}
        maxLength={1}
        className={`w-12 h-12 text-center bg-yellow-50 border-2 border-l-0 rounded-r-md text-2xl sm:text-3xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
          isWrong ? 'border-red-500 animate-shake' : 'border-sky-400'
        }`}
        onFocus={(e) => e.target.select()}
      />
    </div>
  );
};

const AlignedNumber: React.FC<{
  num: number | null;
  top: string;
  className?: string;
  isThreeDigitLayout?: boolean;
  alignOnesIn?: 'hundreds' | 'tens' | 'ones';
}> = ({ num, top, className = '', isThreeDigitLayout = false, alignOnesIn = 'ones' }) => {
    if (num === null) return null;
    const s = String(num);
    const digits = s.split('');

    const hColLeft = 32;
    const tColLeft = isThreeDigitLayout ? 80 : 56;
    const oColLeft = isThreeDigitLayout ? 128 : 104;
    const colWidth = 48; // w-12 is 3rem = 48px

    let onesColPos: number;
    if (alignOnesIn === 'hundreds') {
        onesColPos = hColLeft;
    } else if (alignOnesIn === 'tens') {
        onesColPos = tColLeft;
    } else { // 'ones'
        onesColPos = oColLeft;
    }

    return (
        <>
            {digits.map((digit, index) => {
                const left = onesColPos - (digits.length - 1 - index) * colWidth;
                return (
                    <div
                        key={index}
                        className={`absolute ${top} w-12 h-12 flex justify-center items-center ${className}`}
                        style={{ left: `${left}px` }}
                    >
                        {digit}
                    </div>
                );
            })}
        </>
    );
}


const LongDivision: React.FC<LongDivisionProps> = ({ dividend, divisor }) => {
  const [step, setStep] = useState(0);
  const [userValues, setUserValues] = useState<(string | null)[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentInputTens, setCurrentInputTens] = useState('');
  const [currentInputOnes, setCurrentInputOnes] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'wrong'>('idle');
  
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const {
    isThreeDigit,
    hundredsOfDividend, tensOfDividend, onesOfDividend,
    quotientHundreds, firstProduct, numAfterBringDown1,
    quotientTens, secondProduct, numAfterBringDown2,
    quotientOnes, thirdProduct, finalRemainder,
    finalQuotient, remHundreds, remTens,
  } = useMemo(() => {
    const is3Digit = dividend >= 100;
    const h = Math.floor(dividend / 100);
    const t = Math.floor((dividend % 100) / 10);
    const o = dividend % 10;
    
    // For 3-digit: divide hundreds. For 2-digit: divide tens.
    const numToDivide1 = is3Digit ? h : t;
    const q1 = Math.floor(numToDivide1 / divisor);
    const p1 = q1 * divisor;
    const r1 = numToDivide1 - p1;

    // Bring down next digit.
    const numToDivide2 = r1 * 10 + (is3Digit ? t : o);
    const q2 = Math.floor(numToDivide2 / divisor);
    const p2 = q2 * divisor;
    const r2 = numToDivide2 - p2;

    // Only for 3-digit: bring down last digit.
    const numToDivide3 = r2 * 10 + o;
    const q3 = is3Digit ? Math.floor(numToDivide3 / divisor) : 0;
    const p3 = is3Digit ? q3 * divisor : 0;
    const r3 = is3Digit ? numToDivide3 - p3 : 0;

    return {
      isThreeDigit: is3Digit,
      hundredsOfDividend: h, tensOfDividend: t, onesOfDividend: o,
      quotientHundreds: is3Digit ? q1 : 0,
      firstProduct: is3Digit ? p1 : 0,
      numAfterBringDown1: is3Digit ? numToDivide2 : 0,
      quotientTens: is3Digit ? q2 : q1,
      secondProduct: is3Digit ? p2 : p1,
      numAfterBringDown2: is3Digit ? numToDivide3 : numToDivide2,
      quotientOnes: is3Digit ? q3 : q2,
      thirdProduct: is3Digit ? p3 : p2,
      finalRemainder: is3Digit ? r3 : r2,
      finalQuotient: is3Digit ? (q1 * 100 + q2 * 10 + q3) : (q1 * 10 + q2),
      remHundreds: r1,
      remTens: r2,
    };
  }, [dividend, divisor]);

  const stepDefs = useMemo(() => {
    const steps = [];
    if (isThreeDigit) {
      steps.push({
        instruction: `먼저, 백의 자리 수 ${hundredsOfDividend}을(를) ${divisor}(으)로 나눈 몫을 백의 자리 위에 적어보세요.`,
        correctValue: quotientHundreds,
        maxLength: 1,
      });
      steps.push({
        instruction: `백의 자리 몫(${quotientHundreds})과 나누는 수(${divisor})를 곱한 값(${firstProduct})을 아래에 적으세요.`,
        correctValue: firstProduct,
        maxLength: String(firstProduct).length,
      });
    }
    
    steps.push({
      instruction: `${isThreeDigit ? `${numAfterBringDown1}을(를)`: `십의 자리 수 ${tensOfDividend}을(를)`} ${divisor}(으)로 나눈 몫을 십의 자리 위에 적어보세요.`,
      correctValue: quotientTens,
      maxLength: 1,
    });
    steps.push({
      instruction: `십의 자리 몫(${quotientTens})과 나누는 수(${divisor})를 곱한 값(${secondProduct})을 아래에 적으세요.`,
      correctValue: secondProduct,
      maxLength: String(secondProduct).length,
    });
    
    steps.push({
      instruction: `남은 수 ${numAfterBringDown2}를 ${divisor}(으)로 나눈 몫을 일의 자리 위에 적으세요.`,
      correctValue: quotientOnes,
      maxLength: 1,
    });
    steps.push({
      instruction: `일의 자리 몫(${quotientOnes})과 나누는 수(${divisor})를 곱한 값(${thirdProduct})을 아래에 적으세요.`,
      correctValue: thirdProduct,
      maxLength: String(thirdProduct).length,
    });
    steps.push({
      instruction: `마지막으로, ${numAfterBringDown2}에서 ${thirdProduct}을(를) 뺀 나머지를 구하세요.`,
      correctValue: finalRemainder,
      maxLength: String(finalRemainder).length,
    });

    return steps;
  }, [dividend, divisor, isThreeDigit, hundredsOfDividend, quotientHundreds, firstProduct, numAfterBringDown1, tensOfDividend, quotientTens, secondProduct, numAfterBringDown2, quotientOnes, thirdProduct, finalRemainder]);

  const MAX_STEPS = stepDefs.length;

  useEffect(() => {
    handleReset();
  }, [dividend, divisor]);
  
  useEffect(() => {
    const stepToActionMap: {[key: number]: number} = isThreeDigit 
      ? { 2: 1, 4: 2, 6: 3, 7: 4 } 
      : { 2: 1, 4: 2, 5: 3 };
    
    const targetRefIndex = stepToActionMap[step];
    if (targetRefIndex !== undefined && stepRefs.current[targetRefIndex]) {
       const timer = setTimeout(() => {
        stepRefs.current[targetRefIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step, isThreeDigit]);

  const handleReset = () => {
    setStep(0);
    setUserValues(Array(MAX_STEPS).fill(null));
    setCurrentInput('');
    setCurrentInputTens('');
    setCurrentInputOnes('');
    setFeedback('idle');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'single' | 'tens' | 'ones') => {
      const { value } = e.target;
      if (!/^\d*$/.test(value)) return;

      const maxLength = parseInt(e.target.getAttribute('maxLength') || '1', 10);
      if (value.length > maxLength) return;

      if (type === 'single') setCurrentInput(value);
      else if (type === 'tens') setCurrentInputTens(value);
      else if (type === 'ones') setCurrentInputOnes(value);
      
      if (feedback === 'wrong') setFeedback('idle');
  };
  
  const checkAnswerAndProceed = () => {
    if (step >= MAX_STEPS) return;

    const { correctValue, maxLength } = stepDefs[step];
    const submittedValueStr = maxLength > 1 ? (currentInputTens + currentInputOnes) : currentInput;

    if (submittedValueStr.trim() === '') return;

    if (parseInt(submittedValueStr, 10) === correctValue) {
      const newValues = [...userValues];
      newValues[step] = String(correctValue);
      setUserValues(newValues);
      
      setStep(step + 1);
      setCurrentInput('');
      setCurrentInputTens('');
      setCurrentInputOnes('');
      setFeedback('idle');
    } else {
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback('idle');
        setCurrentInput('');
        setCurrentInputTens('');
        setCurrentInputOnes('');
      }, 600);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkAnswerAndProceed();
  };

  const renderGroupedBlocks = (qH: number, qT: number, qO: number) => {
    const groups = [];
    for(let i=0; i<divisor; i++) {
        groups.push(
            <div key={i} className="border-2 border-dashed border-slate-400 rounded-lg p-2 min-w-[80px]">
                {isThreeDigit && <BlockGrid count={qH} type="hundred" />}
                <BlockGrid count={qT} type="ten" />
                <BlockGrid count={qO} type="one" />
            </div>
        )
    }
    return groups;
  }
  
  const gridColsMap: { [key: number]: string } = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', };
  const gridColsClass = gridColsMap[Math.min(divisor, 4)] || 'grid-cols-4';
  
  // Layout constants
  const hColLeft = 32;
  const tColLeft = isThreeDigit ? 80 : 56;
  const oColLeft = isThreeDigit ? 128 : 104;

  const renderCalculationInput = (stepIndex: number, alignOnesIn: 'hundreds' | 'tens' | 'ones') => {
    const currentStepDef = stepDefs[stepIndex];
    if (!currentStepDef) return null;

    const { maxLength } = currentStepDef;
    const isTwoDigitInput = maxLength > 1;
    let colLeft;
    if (alignOnesIn === 'hundreds') colLeft = hColLeft;
    else if (alignOnesIn === 'tens') colLeft = tColLeft;
    else colLeft = oColLeft;
    
    const inputLeft = isTwoDigitInput ? colLeft - 48 : colLeft;

    return (
      <div className="absolute" style={{ left: `${inputLeft}px` }}>
        {isTwoDigitInput ? (
          <SplitLongDivisionInput tensValue={currentInputTens} onesValue={currentInputOnes} onTensChange={e => handleInputChange(e, 'tens')} onOnesChange={e => handleInputChange(e, 'ones')} isWrong={feedback === 'wrong'} onEnterPress={checkAnswerAndProceed} />
        ) : (
          <LongDivisionInput value={currentInput} onChange={e => handleInputChange(e, 'single')} isWrong={feedback === 'wrong'} maxLength={1} autoFocus onEnterPress={checkAnswerAndProceed} />
        )}
      </div>
    );
  };
  
  const renderPlaceholder = (stepIndex: number, alignOnesIn: 'hundreds' | 'tens' | 'ones') => {
    const currentStepDef = stepDefs[stepIndex];
    if (!currentStepDef) return null;

    const { maxLength } = currentStepDef;
    const isTwoDigit = maxLength > 1;
    let colLeft;
    if (alignOnesIn === 'hundreds') colLeft = hColLeft;
    else if (alignOnesIn === 'tens') colLeft = tColLeft;
    else colLeft = oColLeft;
    
    const placeholderLeft = isTwoDigit ? colLeft - 48 : colLeft;
    
    return (
        <div className="absolute" style={{ left: `${placeholderLeft}px` }}>
            <div className={`${isTwoDigit ? 'w-24' : 'w-12'} h-12 bg-slate-100 rounded-md`}></div>
        </div>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
        <div className="xl:col-span-3 space-y-4">
            <h2 className="text-2xl font-bold text-slate-700 text-center mb-4">구체물로 확인하기</h2>
            
            <StepCard step={1} title={`'${dividend}'를 묶음과 낱개로 나타내요`}>
                <div className="flex flex-wrap gap-4 items-start p-2">
                  {isThreeDigit && <div><p className="font-bold mb-1 text-slate-600">백의 묶음 {hundredsOfDividend}개</p><BlockGrid count={hundredsOfDividend} type="hundred" /></div>}
                  <div><p className="font-bold mb-1 text-slate-600">십의 묶음 {tensOfDividend}개</p><BlockGrid count={tensOfDividend} type="ten" /></div>
                  <div><p className="font-bold mb-1 text-slate-600">낱개 {onesOfDividend}개</p><BlockGrid count={onesOfDividend} type="one" /></div>
                </div>
            </StepCard>

            {isThreeDigit && step >= 2 && (
              <div ref={el => stepRefs.current[1] = el}>
                <StepCard step={2} title={`백의 묶음 ${hundredsOfDividend}개를 ${divisor}개의 묶음으로 나눠요`}>
                  <p className="mb-4">
                    각 묶음에 <span className="font-bold text-purple-600">{quotientHundreds}</span>개의 백의 묶음을 넣을 수 있어요. 
                    총 <span className="font-bold">{firstProduct}</span>개의 백의 묶음을 사용했어요.
                  </p>
                  <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                    <div>
                      <p className="font-bold text-slate-600 mb-2">나눈 결과</p>
                      <div className={`grid ${gridColsClass} gap-2 mb-4`}>
                        {Array.from({ length: divisor }).map((_, i) => (
                          <div key={i} className="border-2 border-dashed border-slate-400 rounded-lg p-2 min-h-[100px] flex justify-center items-center">
                            <BlockGrid count={quotientHundreds} type="hundred" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-600 mb-2">남은 블록</p>
                      <div className="flex flex-wrap gap-4 items-start p-2">
                        {remHundreds > 0 && <div><p className="font-bold mb-1 text-sm text-slate-500">백의 묶음 {remHundreds}개</p><BlockGrid count={remHundreds} type="hundred" /></div>}
                        <div><p className="font-bold mb-1 text-sm text-slate-500">십의 묶음 {tensOfDividend}개</p><BlockGrid count={tensOfDividend} type="ten" /></div>
                        <div><p className="font-bold mb-1 text-sm text-slate-500">낱개 {onesOfDividend}개</p><BlockGrid count={onesOfDividend} type="one" /></div>
                      </div>
                    </div>
                  </div>
                </StepCard>
              </div>
            )}

            {step >= (isThreeDigit ? 4 : 2) && (
              <div ref={el => stepRefs.current[isThreeDigit ? 2 : 1] = el}>
                <StepCard step={isThreeDigit ? 3 : 2} title={isThreeDigit ? `남은 블록을 십의 묶음으로 바꿔서 나눠요` : `십의 묶음 ${tensOfDividend}개를 ${divisor}개의 묶음으로 나눠요`}>
                  {isThreeDigit && (
                    <div className="mb-4">
                      <p>
                        남은 백의 묶음 <span className="font-bold">{remHundreds}</span>개를 십의 묶음 <span className="font-bold">{remHundreds * 10}</span>개로 바꿉니다. 
                        원래 있던 십의 묶음 <span className="font-bold">{tensOfDividend}</span>개를 더하면 총 <span className="font-bold text-sky-600">{numAfterBringDown1}</span>개의 십의 묶음이 됩니다.
                      </p>
                      <div className="bg-slate-50 p-4 rounded-lg my-3">
                        <p className="font-bold text-slate-600 mb-2">총 십의 묶음 블록: {numAfterBringDown1}개</p>
                        <BlockGrid count={numAfterBringDown1} type="ten" itemsPerRow={10} />
                      </div>
                    </div>
                  )}
                  <p className="mb-4">
                    이 십의 묶음들을 {divisor}묶음으로 나누면 각 묶음에 <span className="font-bold text-sky-600">{quotientTens}</span>개씩 들어가고 <span className="font-bold text-amber-600">{remTens}</span>개가 남습니다.
                  </p>
                   <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                    <div>
                      <p className="font-bold text-slate-600 mb-2">나눈 결과</p>
                      <div className={`grid ${gridColsClass} gap-2 mb-4`}>
                        {Array.from({ length: divisor }).map((_, i) => (
                          <div key={i} className="border-2 border-dashed border-slate-400 rounded-lg p-2 min-h-[100px] flex justify-center items-center">
                            <BlockGrid count={quotientTens} type="ten" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-600 mb-2">남은 블록</p>
                      <div className="flex flex-wrap gap-4 items-start p-2">
                        {remTens > 0 && <div><p className="font-bold mb-1 text-sm text-slate-500">십의 묶음 {remTens}개</p><BlockGrid count={remTens} type="ten" /></div>}
                        <div><p className="font-bold mb-1 text-sm text-slate-500">낱개 {onesOfDividend}개</p><BlockGrid count={onesOfDividend} type="one" /></div>
                      </div>
                    </div>
                  </div>
                </StepCard>
              </div>
            )}

            {step >= (isThreeDigit ? 6 : 4) && (
              <div ref={el => stepRefs.current[isThreeDigit ? 3 : 2] = el}>
                <StepCard step={isThreeDigit ? 4 : 3} title={`남은 블록을 낱개로 바꿔서 나눠요`}>
                   <div className="mb-4">
                      <p>
                        남은 십의 묶음 <span className="font-bold">{remTens}</span>개를 낱개 <span className="font-bold">{remTens * 10}</span>개로 바꿉니다. 
                        원래 있던 낱개 <span className="font-bold">{onesOfDividend}</span>개를 더하면 총 <span className="font-bold text-emerald-600">{numAfterBringDown2}</span>개의 낱개가 됩니다.
                      </p>
                      <div className="bg-slate-50 p-4 rounded-lg my-3">
                        <p className="font-bold text-slate-600 mb-2">총 낱개 블록: {numAfterBringDown2}개</p>
                        <BlockGrid count={numAfterBringDown2} type="one" itemsPerRow={10} />
                      </div>
                    </div>
                    <p className="mb-4">
                      이 낱개들을 {divisor}묶음으로 나누면 각 묶음에 <span className="font-bold text-emerald-600">{quotientOnes}</span>개씩 들어가고 <span className="font-bold text-amber-600">{finalRemainder}</span>개가 남습니다.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                       <div>
                          <p className="font-bold text-slate-600 mb-2">나눈 결과</p>
                          <div className={`grid ${gridColsClass} gap-2 mb-4`}>
                            {Array.from({ length: divisor }).map((_, i) => (
                              <div key={i} className="border-2 border-dashed border-slate-400 rounded-lg p-2 min-h-[100px] flex justify-center items-center">
                                <BlockGrid count={quotientOnes} type="one" />
                              </div>
                            ))}
                          </div>
                        </div>
                        {finalRemainder > 0 && (
                          <div>
                            <p className="font-bold text-slate-600 mb-2">남은 블록</p>
                            <div className="flex flex-wrap gap-4 items-start p-2">
                              <div><p className="font-bold mb-1 text-sm text-slate-500">낱개 {finalRemainder}개</p><BlockGrid count={finalRemainder} type="one" /></div>
                            </div>
                          </div>
                        )}
                    </div>
                </StepCard>
              </div>
            )}

            {step >= MAX_STEPS && (
                <div ref={el => stepRefs.current[isThreeDigit ? 4 : 3] = el}>
                  <StepCard step={isThreeDigit ? 5 : 4} title="나눗셈 결과">
                      <p className="mb-4 text-lg">
                          <span className="font-bold text-indigo-600">{dividend}</span> ÷ <span className="font-bold text-indigo-600">{divisor}</span>의 몫은 <span className="font-bold text-sky-600">{finalQuotient}</span>이고, 나머지는 <span className="font-bold text-amber-600">{finalRemainder}</span>입니다.
                      </p>
                      <div className="bg-slate-50 p-4 rounded-lg">
                          <p className="font-bold text-slate-600 mb-2">몫: 각 묶음</p>
                          <div className={`grid ${gridColsClass} gap-2 mb-4`}>{renderGroupedBlocks(quotientHundreds, quotientTens, quotientOnes)}</div>
                          {finalRemainder > 0 && (
                              <div className="mt-4 border-t pt-4">
                                  <p className="font-bold text-slate-600 mb-2">나머지</p><BlockGrid count={finalRemainder} type="one" />
                              </div>
                          )}
                      </div>
                  </StepCard>
                </div>
            )}
        </div>

        <div className="xl:col-span-2 sticky top-8">
             <h2 className="text-2xl font-bold text-slate-700 text-center mb-4">세로셈으로 풀기</h2>
             <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                <div className="flex items-start justify-center">
                    <div className="font-mono text-2xl sm:text-3xl relative" style={{ width: isThreeDigit ? '220px' : '180px', height: '400px' }}>
                    <div className="absolute top-12 left-2 font-bold text-slate-800 text-3xl">{divisor}</div>
                    <div className={`absolute top-12 ${isThreeDigit ? 'left-[28px]' : 'left-12'} ${isThreeDigit ? 'w-[152px]' : 'w-[112px]'} h-px border-t-4 border-slate-700`}></div>
                    <div className={`absolute top-12 ${isThreeDigit ? 'left-[28px]' : 'left-12'} h-12 w-px border-l-4 border-slate-700`}></div>
                    
                    {isThreeDigit && <div className={`absolute top-0 w-12 h-12 flex items-center justify-center`} style={{left: `${hColLeft}px`}}>{step === 0 ? <LongDivisionInput value={currentInput} onChange={e => handleInputChange(e, 'single')} isWrong={feedback==='wrong'} maxLength={1} autoFocus onEnterPress={checkAnswerAndProceed} /> : step > 0 ? <span className="font-bold text-purple-600">{userValues[0]}</span> : <div className="w-12 h-12 bg-slate-100 rounded-md"></div>}</div>}
                    <div className={`absolute top-0 w-12 h-12 flex items-center justify-center`} style={{left: `${tColLeft}px`}}>{step === (isThreeDigit ? 2:0) ? <LongDivisionInput value={currentInput} onChange={e => handleInputChange(e, 'single')} isWrong={feedback==='wrong'} maxLength={1} autoFocus onEnterPress={checkAnswerAndProceed} /> : step > (isThreeDigit ? 2:0) ? <span className="font-bold text-sky-600">{userValues[isThreeDigit ? 2 : 0]}</span> : <div className="w-12 h-12 bg-slate-100 rounded-md"></div>}</div>
                    <div className={`absolute top-0 w-12 h-12 flex items-center justify-center`} style={{left: `${oColLeft}px`}}>{step === (isThreeDigit ? 4:2) ? <LongDivisionInput value={currentInput} onChange={e => handleInputChange(e, 'single')} isWrong={feedback==='wrong'} maxLength={1} autoFocus onEnterPress={checkAnswerAndProceed} /> : step > (isThreeDigit ? 4:2) ? <span className="font-bold text-emerald-600">{userValues[isThreeDigit ? 4:2]}</span> : <div className="w-12 h-12 bg-slate-100 rounded-md"></div>}</div>

                    <AlignedNumber num={dividend} top="top-12" className="text-slate-800" isThreeDigitLayout={isThreeDigit} />

                    {/* Step 1: Hundreds */}
                    {isThreeDigit && <>
                        <div className={`absolute top-[84px] left-[0px] transition-opacity duration-300 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>-</div>
                        <div className={`absolute top-[68px] w-full h-12 transition-opacity duration-300 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>{step === 1 ? renderCalculationInput(1, 'hundreds') : step > 1 ? <AlignedNumber num={firstProduct} top="top-0" isThreeDigitLayout={isThreeDigit} alignOnesIn="hundreds" /> : renderPlaceholder(1, 'hundreds')}</div>
                        <div className={`absolute top-[120px] left-[32px] w-[144px] border-t-2 border-slate-800 transition-opacity duration-300 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}></div>
                        <div className={`absolute top-[128px] w-full transition-opacity duration-300 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}><AlignedNumber num={numAfterBringDown1} top="top-0" className="font-bold" isThreeDigitLayout={isThreeDigit} alignOnesIn="tens" /></div>
                    </>}

                    {/* Step 2: Tens */}
                    <div className={`absolute ${isThreeDigit ? 'top-[188px]' : 'top-[84px]'} ${isThreeDigit ? 'left-[0px]' : 'left-[24px]'} transition-opacity duration-300 ${step >= (isThreeDigit ? 3 : 1) ? 'opacity-100' : 'opacity-0'}`}>-</div>
                    <div className={`absolute ${isThreeDigit ? 'top-[176px]' : 'top-[68px]'} w-full h-12 transition-opacity duration-300 ${step >= (isThreeDigit ? 3 : 1) ? 'opacity-100' : 'opacity-0'}`}>{step === (isThreeDigit ? 3 : 1) ? renderCalculationInput(isThreeDigit ? 3 : 1, 'tens') : step > (isThreeDigit ? 3 : 1) ? <AlignedNumber num={secondProduct} top="top-0" isThreeDigitLayout={isThreeDigit} alignOnesIn="tens" /> : renderPlaceholder(isThreeDigit ? 3 : 1, 'tens')}</div>
                    <div className={`absolute ${isThreeDigit ? 'top-[228px]' : 'top-[120px]'} left-[${isThreeDigit ? '32px': '56px'}] ${isThreeDigit ? 'w-[144px]' : 'w-[96px]'} border-t-2 border-slate-800 transition-opacity duration-300 ${step >= (isThreeDigit ? 3 : 1) ? 'opacity-100' : 'opacity-0'}`}></div>
                    <div className={`absolute ${isThreeDigit ? 'top-[236px]' : 'top-[128px]'} w-full transition-opacity duration-300 ${step >= (isThreeDigit ? 4 : 2) ? 'opacity-100' : 'opacity-0'}`}><AlignedNumber num={numAfterBringDown2} top="top-0" className="font-bold" isThreeDigitLayout={isThreeDigit} alignOnesIn="ones" /></div>
                    
                    {/* Step 3: Ones */}
                    <div className={`absolute ${isThreeDigit ? 'top-[292px]' : 'top-[188px]'} ${isThreeDigit ? 'left-[48px]' : 'left-[24px]'} transition-opacity duration-300 ${step >= (isThreeDigit ? 5:3) ? 'opacity-100' : 'opacity-0'}`}>-</div>
                    <div className={`absolute ${isThreeDigit ? 'top-[280px]' : 'top-[176px]'} w-full h-12 transition-opacity duration-300 ${step >= (isThreeDigit ? 5:3) ? 'opacity-100' : 'opacity-0'}`}>{step === (isThreeDigit ? 5:3) ? renderCalculationInput(isThreeDigit ? 5:3, 'ones') : step > (isThreeDigit ? 5:3) ? <AlignedNumber num={thirdProduct} top="top-0" isThreeDigitLayout={isThreeDigit} alignOnesIn="ones" /> : renderPlaceholder(isThreeDigit ? 5:3, 'ones')}</div>
                    <div className={`absolute ${isThreeDigit ? 'top-[332px]' : 'top-[228px]'} left-[${isThreeDigit ? '32px': '56px'}] ${isThreeDigit ? 'w-[144px]' : 'w-[96px]'} border-t-2 border-slate-800 transition-opacity duration-300 ${step >= (isThreeDigit ? 5:3) ? 'opacity-100' : 'opacity-0'}`}></div>
                    <div className={`absolute ${isThreeDigit ? 'top-[340px]' : 'top-[236px]'} w-full h-12 transition-opacity duration-300 ${step >= (isThreeDigit ? 6:4) ? 'opacity-100' : 'opacity-0'}`}>{step === (isThreeDigit ? 6:4) ? <div style={{position: 'absolute', left: `${oColLeft}px`}}><LongDivisionInput value={currentInput} onChange={e => handleInputChange(e, 'single')} isWrong={feedback==='wrong'} maxLength={String(finalRemainder).length} autoFocus onEnterPress={checkAnswerAndProceed} /></div> : step > (isThreeDigit ? 6:4) ? <AlignedNumber num={finalRemainder} top="top-0" className="font-bold text-amber-600" isThreeDigitLayout={isThreeDigit} alignOnesIn="ones" /> : <div className="absolute w-12 h-12 bg-slate-100 rounded-md" style={{left: `${oColLeft}px`}}></div>}</div>
                  </div>
                </div>
                <div className="mt-4">
                    <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-lg shadow-inner border border-slate-200">
                        <div className="min-h-[6rem]">
                            {step < MAX_STEPS ? (
                                <>
                                    <p className="font-bold text-lg mb-2 text-slate-700">단계 {step + 1}</p>
                                    <p className="text-slate-600">{stepDefs[step].instruction}</p>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <p className="font-bold text-xl text-slate-800">🎉 계산 완료!</p>
                                    <p className="text-lg mt-2">몫 <span className="text-sky-600">{finalQuotient}</span>, 나머지 <span className="text-amber-600">{finalRemainder}</span></p>
                                </div>
                            )}
                        </div>
                        {step < MAX_STEPS && (
                            <div className="flex justify-center mt-4">
                                <button type="submit" className="w-full sm:w-auto px-10 py-2 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors">확인</button>
                            </div>
                        )}
                    </form>
                    <div className="text-center mt-3">
                        <button onClick={handleReset} title="처음부터" className="inline-flex items-center gap-2 px-3 py-1 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors">
                            <RefreshCw size={16} /> 다시 시작
                        </button>
                    </div>
                </div>
             </div>
        </div>
    </div>
  );
};

export default LongDivision;
