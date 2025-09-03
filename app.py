import streamlit as st
import vertexai
from vertexai.generative_models import GenerativeModel
import json

# --- 1. 설정 정보 ---
PROJECT_ID = "fenrir-ai-project"
LOCATION = "us-central1" 
ENDPOINT_ID = "5973430069916336128"
# --------------------

# --- 2. [최종 수정] 인증 및 모든 리소스 로드 ---
@st.cache_resource
def load_resources():
    # --- 인증 정보 처리 ---
    credentials = None
    # Streamlit Cloud 환경에서는 st.secrets를 통해 인증 정보를 가져옵니다.
    if hasattr(st, 'secrets') and "gcp_service_account" in st.secrets:
        creds_dict = st.secrets["gcp_service_account"]
        credentials = google.oauth2.service_account.Credentials.from_service_account_info(creds_dict)
    # 로컬 환경에서는 기존의 gcloud auth 방식을 사용합니다.
    
    # --- 모델 로드 ---
    fenrir_model = None
    try:
        vertexai.init(project=PROJECT_ID, location=LOCATION, credentials=credentials)
        model_endpoint = f"projects/{PROJECT_ID}/locations/{LOCATION}/endpoints/{ENDPOINT_ID}"
        fenrir_model = GenerativeModel(model_endpoint)
    except Exception as e:
        st.error(f"모델 초기화 중 오류 발생: {e}")

    # --- 개념 교과서 로드 ---
    concept_db = {}
    try:
        with open('concepts_su1.json', 'r', encoding='utf-8') as f:
            concept_db_su1 = json.load(f)
        with open('concepts_su2.json', 'r', encoding='utf-8') as f:
            concept_db_su2 = json.load(f)
        concept_db = {**concept_db_su1, **concept_db_su2}
    except Exception as e:
        st.error(f"개념 교과서 로드 중 오류 발생: {e}")
        
    return fenrir_model, concept_db

fenrir_model, concept_database = load_resources()

# --- 3. UI 구성 ---
st.set_page_config(layout="wide")
st.title("🔥 Fenrir AI : The Hyper-Intelligent Personal Tutor")
st.header("v3.1 - Final Architecture")

if not fenrir_model or not concept_database:
    st.error("핵심 리소스 로딩에 실패하여 프로토타입을 실행할 수 없습니다.")
else:
    # --- 4. UI 실행 로직 ---
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("문제 및 풀이 입력")
        problem_text_input = st.text_area("분석할 문제의 내용을 입력하세요.", height=200)
        user_solution_input = st.text_area("자신의 풀이 과정을 자유롭게 서술하세요.", height=250)

    with col2:
        st.subheader("Fenrir AI 분석 결과")

        if st.button("분석 요청"):
            if problem_text_input and user_solution_input:
                with st.spinner("Fenrir AI가 회장님의 풀이를 분석 중입니다... (1/2단계: 개념 추출)"):
                    # --- [최종 수정] 1단계 프롬프트 수정 ---
                    keyword_instruction = (
                        "당신은 최고의 수능 수학 전문가입니다. 당신의 첫 번째 임무는 주어진 문제와 학생의 풀이를 분석하는 것입니다.\n"
                        "1. 먼저, 주어진 문제를 당신 스스로 풀어보아 어떤 개념들이 필요한지 내적으로 파악하시오.\n"
                        "2. 그 후, 당신의 풀이 과정과 학생의 풀이 과정을 종합적으로 고려하여 관련된 핵심 개념 키워드를 추출하시오.\n"
                        "3. 키워드는 반드시 다음 목록 중에서만 선택해야 하며, 최종 결과는 오직 JSON 리스트 형식으로만 출력하시오: " + ", ".join(concept_database.keys())
                    )
                    keyword_input = f"### 문제:\n{problem_text_input}\n\n### 학생의 풀이:\n{user_solution_input}"
                    keyword_prompt = str({"instruction": keyword_instruction, "input": keyword_input})
                    
                    try:
                        response_keywords_raw = fenrir_model.generate_content(keyword_prompt).text
                        cleaned_json_str = response_keywords_raw.strip().replace("```json", "").replace("```", "").strip()
                        extracted_keywords = json.loads(cleaned_json_str)
                    except Exception as e:
                        st.warning("1단계: 개념 키워드를 추출하는 데 실패했습니다. 일반 분석을 시도합니다.")
                        extracted_keywords = []

                with st.spinner("Fenrir AI가 회장님의 풀이를 분석 중입니다... (2/2단계: 최종 피드백 생성)"):
                    # --- 2단계 로직은 변경 없음 ---
                    retrieved_context = ""
                    if extracted_keywords:
                        context_list = ["### 참고 개념\n"]
                        for key in extracted_keywords:
                            if key in concept_database:
                                context_list.append(f"#### {key}\n{json.dumps(concept_database[key], ensure_ascii=False, indent=2)}\n")
                        retrieved_context = "\n".join(context_list)
                    
                    final_instruction = (
                        "당신은 세계 최고의 수능 수학 과외 선생님 'Fenrir AI'입니다. 당신은 단순한 채점기가 아니라, 학생의 사고 과정을 이해하고 성장을 돕는 지혜로운 튜터입니다.\n"
                        "주어진 문제와 학생의 풀이 과정을 보고, 다음 규칙에 따라 피드백을 제공하시오.\n\n"
                        "1. 우선 학생이 제시한 문제를 보고 표준 풀이법과 **최적화 풀이법** 두 가지를 다 생각해 보시오. 그 이후 **출제자가 기대하는 접근법**을 생각하고 **출제자 의도 분석**을 해서 표준 풀이법에 비해 **최적화 풀이**가 왜 더 우수한지 **출제자 의도**를 추출하시오.\n"
                        "2. 학생의 풀이가 최종 정답에 도달했는지, 그리고 그 과정이 수학적으로 올바른지 논리적 오류가 없는지 확인하시오.\n"
                        "3. 학생의 풀이를 꼼꼼히 검사하여 **만약 학생의 풀이 과정에 '사소한 실수'나 명백한 '계산 실수'나 '논리적 오류'가 존재한다면**, 그 부분을 정확히 짚어주고 왜 틀렸는지 설명하시오.\n"
                        "4. 학생의 풀이와 당신의 내재된 지식(표준 풀이, 최적화 풀이)과 비교하시오. **만약 학생의 풀이가 논리적 오류 없이 정답을 맞혔더라도**,  학생의 풀이가 비효율적이거나 표준 풀이에 가깝다고 판단되면, 학생의 풀이를 인정해주면서 **'출제 의도 분석'**의 관점에서 더 나은 방법(최적화 풀이)이 있음을 힌트와 함께 제시하시오.\n"
                        "5. **만약 학생의 풀이가 최적화 풀이와 유사한 완벽한 풀이라면**, 칭찬과 함께 해당 문제의 핵심 개념을 다시 한번 짚어주어 지식을 공고히 하도록 도우시오.\n"
                        "6. 학생의 표현이 다소 부정확하더라도 전체적인 논리적 흐름이 맞거나 논리적으로 동치이면, '논리적 오류'로 지적하기보다는 더 정확한 표현을 제안하는 방식으로 부드럽게 교정하시오.\n"
                        "7. 개념 교재에서 추출한 키워드들을 개념에 근거하여 최적화 풀이와 mapping 하시오.\n"
                        "8. 답변 시작 부분은 친절한 튜터로서 인사를 하고 그 이후 반드시 다음의 4단계 형식에 맞춰 목차식으로 구성하시오: '1. 분석 결론', '2. 학생의 풀이 과정 검토', '3. 최적화 풀이', '4. 개념 Mapping', '5. 결론: 출제자의 의도 분석'."
                    )
                    final_input = (f"{retrieved_context}\n\n---\n\n### 문제\n{problem_text_input}\n\n### 학생의 풀이\n{user_solution_input}")
                    final_prompt = str({"instruction": final_instruction, "input": final_input})
                    
                    try:
                        final_response = fenrir_model.generate_content(final_prompt)
                        st.session_state['analysis_result'] = final_response.text
                    except Exception as e:
                        st.error(f"API 호출 중 오류가 발생했습니다: {e}")
            else:
                st.warning("분석을 위해 문제와 풀이 과정을 모두 입력해주세요.")

        if 'analysis_result' in st.session_state:
            st.markdown(st.session_state['analysis_result'])