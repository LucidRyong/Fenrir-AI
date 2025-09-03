// 파일 경로: src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';

// POST 요청을 처리하는 함수
export async function POST(request: NextRequest) {
  try {
    // 요청 본문에서 문제와 풀이를 추출합니다.
    const { problem, solution } = await request.json();

    if (!problem || !solution) {
      return NextResponse.json(
        { error: '문제와 풀이 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    // Vercel 환경 변수에서 인증 정보를 가져옵니다.
    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_LOCATION;
    const endpointId = process.env.GCP_ENDPOINT_ID;

  // [수정사항] 불필요한 serviceAccountJson 변수 확인 로직 삭제
    if (!projectId || !location || !endpointId) {
        throw new Error("필수 환경 변수가 설정되지 않았습니다.");
    }
    
      // [최종 수정] VertexAI 초기화가 매우 간단해집니다.
    // GOOGLE_APPLICATION_CREDENTIALS 환경 변수가 있으면 자동으로 인증 정보를 읽습니다.
    const vertex_ai = new VertexAI({ 
        project: projectId, 
        location: location
    });

    // 모델 엔드포인트 지정
    const modelEndpoint = `projects/${projectId}/locations/${location}/endpoints/${endpointId}`;
    const generativeModel = vertex_ai.getGenerativeModel({
      model: modelEndpoint,
    });

    // 최종 프롬프트 구성
    const instruction =  "당신은 세계 최고의 수능 수학 과외 선생님 'Fenrir AI'입니다. 당신은 단순한 채점기가 아니라, 학생의 사고 과정을 이해하고 성장을 돕는 지혜로운 튜터입니다.\n" +
      "답변 시작 부분은 친절한 튜터로서 인사를 하고 그 이후 반드시 다음의 5단계 형식에 맞춰 목차식으로 구성하시오: \n" +
      "'1. 분석 결론\\n\\n', " +
      "'2. 학생의 풀이 과정 검토\\n\\n', " +
      "'3. Fenrir AI의 최적화 풀이\\n\\n', " +
      "'4. 개념 Mapping\\n\\n', " +
      "'5. 결론: 출제자의 의도 분석'\\n\\n." +
      "주어진 문제와 학생의 풀이 과정을 보고, 다음 규칙에 따라 피드백을 제공하시오.\n\n" +
      "(1) 우선 학생이 제시한 문제를 보고 표준 풀이법과 최적화 풀이법 두 가지를 다 생각해 보시오. 그 이후 출제자가 기대하는 접근법을 생각하고 출제자 의도 분석을 해서 표준 풀이법에 비해 최적화 풀이가 왜 더 우수한지 출제자 의도를 추출하시오.\n" +
      "(2) 학생의 풀이가 최종 정답에 도달했는지, 그리고 그 과정이 수학적으로 올바른지 논리적 오류가 없는지 확인하시오.\n" +
      "(3) 학생의 풀이를 꼼꼼히 검사하여 만약 학생의 풀이 과정에 '사소한 실수'나 명백한 '계산 실수'나 '논리적 오류'가 존재한다면, 그 부분을 정확히 짚어주고 왜 틀렸는지 설명하시오.\n" +
      "(4) 학생의 풀이와 당신의 내재된 지식(표준 풀이, 최적화 풀이)과 비교하시오. 만약 학생의 풀이가 논리적 오류 없이 정답을 맞혔더라도, 학생의 풀이가 비효율적이거나 표준 풀이에 가깝다고 판단되면, 학생의 풀이를 인정해주면서 '출제 의도 분석'의 관점에서 더 나은 방법(최적화 풀이)이 있음을 힌트와 함께 제시하시오.\n" +
      "(5) 만약 학생의 풀이가 최적화 풀이와 유사한 완벽한 풀이라면, 칭찬과 함께 해당 문제의 핵심 개념을 다시 한번 짚어주어 지식을 공고히 하도록 도우시오.\n" +
      "(6) 학생의 표현이 다소 부정확하더라도 전체적인 논리적 흐름이 맞거나 논리적으로 동치이면, '논리적 오류'로 지적하기보다는 더 정확한 표현을 제안하는 방식으로 부드럽게 교정하시오.\n" +
      "(7) 개념 교재에서 추출한 키워드들을 개념에 근거하여 최적화 풀이와 mapping 하시오."; // 여기에 최종 instruction 삽입
    const prompt = `${instruction}\n\n### 문제\n${problem}\n\n### 학생의 풀이\n${solution}`;

    // AI 모델 호출
    const resp = await generativeModel.generateContent(prompt);
    // [최종 수정] AI의 응답이 비어있을 가능성에 대비합니다.
    // ?. 연산자는 각 단계에서 값이 undefined나 null이면 즉시 중단하고 undefined를 반환합니다.
    const analysisResult = resp.response?.candidates?.[0]?.content?.parts?.[0]?.text || "AI로부터 유효한 답변을 받지 못했습니다.";


    // 결과 반환
    return NextResponse.json({ result: analysisResult });

  } catch (error: unknown) {
    console.error('Error calling Vertex AI:', error);

// error가 Error 인스턴스인지 확인 후 message에 접근합니다.
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }

    return NextResponse.json(
      { error: 'AI 분석 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}