from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import google.generativeai as genai

# Configure the Gemini API key
genai.configure(api_key="AIzaSyDPA8LNVGITrhhG5k6b7D5SiefFZ7R__kA")

@csrf_exempt
def summarize_session(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        session_notes = data.get('session_notes', '')

        try:
            # Generate the summary using the Gemini API
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            Analyze the following therapy session notes and generate a summary in the following format:

            **Main Themes:**
            - [Theme 1]
            - [Theme 2]
            - [Theme 3]

            **Key Insights:**
            - [Insight 1]
            - [Insight 2]
            - [Insight 3]

            **Action Items:**
            - [Action Item 1]
            - [Action Item 2]
            - [Action Item 3]

            **Next Session Goals:**
            - [Goal 1]
            - [Goal 2]
            - [Goal 3]

            Session Notes:
            {session_notes}
            """
            response = model.generate_content(prompt)

            # Parse the response and format it as JSON
            summary = parse_summary(response.text)

            return JsonResponse(summary)
        except Exception as e:
            print(f"An error occurred during Gemini API call: {e}")
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)

def parse_summary(text):
    summary = {
        'mainThemes': [],
        'keyInsights': [],
        'actionItems': [],
        'nextSessionGoals': []
    }
    current_section = None
    for line in text.split('\n'):
        line = line.strip()
        if line.startswith('**Main Themes:**'):
            current_section = 'mainThemes'
        elif line.startswith('**Key Insights:**'):
            current_section = 'keyInsights'
        elif line.startswith('**Action Items:**'):
            current_section = 'actionItems'
        elif line.startswith('**Next Session Goals:**'):
            current_section = 'nextSessionGoals'
        elif line.startswith('- ') and current_section:
            summary[current_section].append(line[2:])
    return summary
