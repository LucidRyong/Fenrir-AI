'use client'; // This directive is necessary for using React Hooks like useState

import { useState } from 'react';

export default function Home() {
  // --- 상태 관리 변수 추가 ---
  const [problemInput, setProblemInput] = useState('');
  const [solutionInput, setSolutionInput] =
    useState('');
  const [analysisResult, setAnalysisResult] = useState(
    '분석 결과가 여기에 표시됩니다...'
  );
  const [isLoading, setIsLoading] = useState(false);

// page.tsx 파일의 handleAnalysisRequest 함수 부분만 교체합니다.
const handleAnalysisRequest = async () => {
  if (!problemInput || !solutionInput) {
    alert('문제와 풀이 과정을 모두 입력해주세요.');
    return;
  }
  setIsLoading(true);
  setAnalysisResult('Fenrir AI가 사용자의 풀이를 분석 중입니다...');

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problem: problemInput,
        solution: solutionInput,
      }),
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.statusText}`);
    }

    const data = await response.json();
    setAnalysisResult(data.result);

  } catch (error) {
    console.error('Analysis request failed:', error);
    setAnalysisResult(`분석 요청 중 오류가 발생했습니다. ${error}`);
  }

  setIsLoading(false);
};

  return (
    <main className="bg-gray-900 text-white min-h-screen p-8 font-sans">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold">
          🔥 Fenrir AI : The Hyper-Intelligent Personal Tutor
        </h1>
        <p className="text-lg text-gray-400 mt-2">
          v2.0
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* --- 왼쪽 입력 영역 --- */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">문제 및 풀이 입력</h2>

          <label
            htmlFor="problem-input"
            className="block text-sm font-medium text-gray-300"
          >
            분석할 문제의 내용
          </label>
          <textarea
            id="problem-input"
            rows={8}
            value={problemInput}
            onChange={(e) => setProblemInput(e.target.value)}
            className="mt-1 block w-full bg-gray-700 rounded-md border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-white p-2"
            placeholder="여기에 분석할 문제 내용을 입력하십시오."
          ></textarea>

          <label
            htmlFor="solution-input"
            className="block text-sm font-medium text-gray-300 mt-4"
          >
            자신의 풀이 과정
          </label>
          <textarea
            id="solution-input"
            rows={10}
            value={solutionInput}
            onChange={(e) => setSolutionInput(e.target.value)}
            className="mt-1 block w-full bg-gray-700 rounded-md border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-white p-2"
            placeholder="자신의 풀이 과정을 자유롭게 서술하세요."
          ></textarea>

          <button
            onClick={handleAnalysisRequest}
            disabled={isLoading}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
          >
            {isLoading ? '분석 중...' : '분석 요청'}
          </button>
        </div>

        {/* --- 오른쪽 출력 영역 --- */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Fenrir AI 분석 결과</h2>
          <div className="bg-gray-900 h-full rounded-md p-4 text-gray-300 whitespace-pre-wrap">
            {analysisResult}
          </div>
        </div>
      </div>
    </main>
  );
}