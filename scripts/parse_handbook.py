import pypdf
import re
import json
import os
from datetime import datetime, timedelta

PDF_PATH = "180_day_interview_handbook_beginner_project_fixed.pdf"
OUTPUT_JSON = "src/data/curriculum_180_days.json"

reader = pypdf.PdfReader(PDF_PATH)
print(f"Total PDF pages: {len(reader.pages)}")

# Extract text from pages 7 to 126 (0-indexed 6 to 126)
pages_text = []
for i in range(6, 126):
    pages_text.append(reader.pages[i].extract_text())

full_text = "\n".join(pages_text)
# Remove running header
full_text = re.sub(r'180-Day Software Engineering Interview Preparation Handbook\s+Page\s+\d+', '', full_text)

# Regex matching day headers
pattern = r'(Day\s+(\d+)\s+[—\-]\s+Week\s+(\d+)\s+[—\-]\s+([A-Za-z]+,\s+([A-Za-z]+)\s+(\d+),\s+(\d{4})))'
matches = list(re.finditer(pattern, full_text))
print(f"Matched {len(matches)} day headers in schedule section.")

phase_names = {
    1: "Java Foundations & Essential DSA",
    2: "Core Interview Patterns",
    3: "Advanced Algorithms",
    4: "CS Fundamentals & System Design",
    5: "Backend Project & Recruiting",
    6: "Final Mock Interviews & Readiness"
}

def get_phase_by_day(day_num):
    if day_num <= 30:
        return phase_names[1]
    elif day_num <= 60:
        return phase_names[2]
    elif day_num <= 90:
        return phase_names[3]
    elif day_num <= 120:
        return phase_names[4]
    elif day_num <= 150:
        return phase_names[5]
    else:
        return phase_names[6]

def categorize_task(title, anchor_title):
    t_lower = title.lower()
    if "spaced review" in t_lower or "queue" in t_lower:
        return "Spaced-repetition reviews", 1
    elif "assessment" in t_lower or "timed interview" in t_lower or "mock" in t_lower:
        return "Weekly or monthly assessments", 4
    elif "problem attempt" in t_lower or "new problem" in t_lower or (anchor_title and anchor_title.lower() in t_lower):
        return "LeetCode practice", 3
    elif "diagnostic" in t_lower or "retrieval" in t_lower or "lesson" in t_lower or "concept study" in t_lower or "technical learning" in t_lower or "java" in t_lower:
        return "Java and Data Structures & Algorithms", 3
    elif "project" in t_lower or "campus task" in t_lower or "api" in t_lower:
        return "Backend project development", 5
    elif "recruiting" in t_lower or "resume" in t_lower or "cpt" in t_lower:
        return "Resume and recruiting", 5
    elif "behavioral" in t_lower or "star" in t_lower:
        return "Behavioral interview preparation", 5
    elif "cs" in t_lower or "system design" in t_lower or "memory" in t_lower or "concurrency" in t_lower or "sql" in t_lower or "networking" in t_lower:
        return "Computer Science fundamentals", 4
    elif "error" in t_lower or "repair" in t_lower or "log" in t_lower or "exit" in t_lower or "deliverable" in t_lower:
        return "Java and Data Structures & Algorithms", 2
    else:
        return "Java and Data Structures & Algorithms", 3

days_list = []

for i in range(len(matches)):
    start_pos = matches[i].start()
    end_pos = matches[i+1].start() if i + 1 < len(matches) else len(full_text)
    chunk = full_text[start_pos:end_pos]
    
    day_num = int(matches[i].group(2))
    week_num = int(matches[i].group(3))
    display_date = matches[i].group(4)
    month_name = matches[i].group(5)
    day_month = int(matches[i].group(6))
    year_val = int(matches[i].group(7))
    
    day_of_week = display_date.split(",")[0].strip()
    
    # Standard ISO Date YYYY-MM-DD
    dt = datetime.strptime(f"{month_name} {day_month} {year_val}", "%B %d %Y")
    iso_date = dt.strftime("%Y-%m-%d")
    
    # Phase from header or fallback
    phase_m = re.search(r'Phase:\s*([^Total\n\r]+?)(?:\s+Total:|\n|$)', chunk)
    phase = phase_m.group(1).strip() if phase_m else get_phase_by_day(day_num)
    if not phase:
        phase = get_phase_by_day(day_num)
        
    # Topic
    topic_m = re.search(r'Today\'?s topic:\s*(.+?)(?=\n|Learning objective:)', chunk, re.IGNORECASE)
    topic = topic_m.group(1).strip() if topic_m else "Focused Study"
    
    # Learning objective
    obj_m = re.search(r'Learning objective:\s*(.+?)(?=Today\'?s anchor problem:|\n\n)', chunk, re.IGNORECASE | re.DOTALL)
    objective = obj_m.group(1).strip().replace('\n', ' ') if obj_m else ""
    
    # Anchor problem
    anchor_m = re.search(r'Today\'?s anchor problem:\s*(.+?)(?=Three-hour plan|\n\n)', chunk, re.IGNORECASE | re.DOTALL)
    anchor_full = anchor_m.group(1).strip().replace('\n', ' ') if anchor_m else ""
    
    anchor_title = ""
    anchor_diff = "Medium"
    anchor_pattern = ""
    if anchor_full:
        parts = anchor_full.split("—")
        if len(parts) >= 2:
            anchor_title = parts[0].strip()
            rest = parts[1].strip()
            diff_m = re.match(r'(Easy|Medium|Hard)', rest, re.IGNORECASE)
            if diff_m:
                anchor_diff = diff_m.group(1).capitalize()
            pattern_m = re.search(r'pattern:\s*([^;.]+)', rest, re.IGNORECASE)
            if pattern_m:
                anchor_pattern = pattern_m.group(1).strip()
        else:
            anchor_title = anchor_full.split(";")[0].strip()
            
    # Three-hour plan
    plan_m = re.search(r'Three-hour plan\s*\n(.+?)(?=\nSpaced-repetition queue|\nSecondary task:|\nToday\'?s deliverable:|\nCompletion criterion:|\nAnchor review dates:|\Z)', chunk, re.IGNORECASE | re.DOTALL)
    if not plan_m:
        plan_m = re.search(r'Three-hour plan\s*(.+?)(?=\nSpaced-repetition queue|\nSecondary task:|\nToday\'?s deliverable:|\nCompletion criterion:|\nAnchor review dates:|\Z)', chunk, re.IGNORECASE | re.DOTALL)
    plan_text = plan_m.group(1).strip() if plan_m else ""
    
    task_items = []
    lines = plan_text.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
        tm = re.match(r'(\d+)\s*min\s*[—\-]\s*(.+)', line)
        if tm:
            duration = int(tm.group(1))
            full_title = tm.group(2).strip()
            cat, priority = categorize_task(full_title, anchor_title)
            
            sub_parts = full_title.split(":", 1)
            t_name = sub_parts[0].strip()
            t_instr = sub_parts[1].strip() if len(sub_parts) > 1 else full_title
            
            resource_url = None
            if anchor_title and (anchor_title.lower() in full_title.lower() or "listed problem" in full_title.lower()):
                slug = re.sub(r'[^a-z0-9]+', '-', anchor_title.lower()).strip('-')
                resource_url = f"https://leetcode.com/problems/{slug}/"
                
            task_items.append({
                "title": t_name if len(t_name) < 55 else full_title[:55],
                "instruction": full_title,
                "category": cat,
                "plannedMinutes": duration,
                "priority": priority,
                "resourceUrl": resource_url
            })
        elif task_items:
            task_items[-1]["instruction"] += " " + line
            
    # Queue
    queue_m = re.search(r'Spaced-repetition queue due today:\s*(.+?)(?=\nSecondary task:|\nToday\'?s deliverable:|\nCompletion criterion:|\nAnchor review dates:|\Z)', chunk, re.IGNORECASE | re.DOTALL)
    queue_str = queue_m.group(1).strip().replace('\n', ' ') if queue_m else ""
    
    # Secondary
    sec_m = re.search(r'Secondary task:\s*(.+?)(?=\nToday\'?s deliverable:|\nCompletion criterion:|\nAnchor review dates:|\Z)', chunk, re.IGNORECASE | re.DOTALL)
    sec_str = sec_m.group(1).strip().replace('\n', ' ') if sec_m else ""
    
    # Deliverable
    deliv_m = re.search(r'Today\'?s deliverable:\s*(.+?)(?=\nCompletion criterion:|\nAnchor review dates:|\Z)', chunk, re.IGNORECASE | re.DOTALL)
    deliv_str = deliv_m.group(1).strip().replace('\n', ' ') if deliv_m else ""
    
    # Completion criterion
    crit_m = re.search(r'Completion criterion:\s*(.+?)(?=\nAnchor review dates:|\Z)', chunk, re.IGNORECASE | re.DOTALL)
    crit_str = crit_m.group(1).strip().replace('\n', ' ') if crit_m else ""
    
    # Review dates
    rev_m = re.search(r'Anchor review dates:\s*(.+?)(?=\n|Day\s+\d+|\Z)', chunk, re.IGNORECASE | re.DOTALL)
    rev_str = rev_m.group(1).strip().replace('\n', ' ') if rev_m else ""
    
    # Calculate Spaced Repetition reviews based on original date
    reviews = []
    if anchor_title:
        intervals = [("R1", 1), ("R3", 3), ("R7", 7), ("R14", 14), ("R30", 30), ("R60", 60)]
        for int_name, offset_days in intervals:
            rev_date = dt + timedelta(days=offset_days)
            rev_day_num = day_num + offset_days
            if rev_day_num <= 180:
                reviews.append({
                    "anchorTitle": anchor_title,
                    "anchorProblem": anchor_full,
                    "pattern": anchor_pattern,
                    "originalDate": iso_date,
                    "intervalName": int_name,
                    "dueDate": rev_date.strftime("%Y-%m-%d"),
                    "targetDayNumber": rev_day_num
                })

    days_list.append({
        "dayNumber": day_num,
        "weekNumber": week_num,
        "date": iso_date,
        "dayOfWeek": day_of_week,
        "displayDate": display_date,
        "phase": phase,
        "topic": topic,
        "learningObjective": objective,
        "anchorProblem": anchor_title,
        "anchorDifficulty": anchor_diff,
        "anchorPattern": anchor_pattern,
        "anchorInstructions": anchor_full,
        "tasks": task_items,
        "queueText": queue_str,
        "secondaryTask": sec_str,
        "deliverable": deliv_str,
        "completionCriterion": crit_str,
        "anchorReviewDates": rev_str,
        "scheduledReviews": reviews,
        "totalPlannedMinutes": sum(t["plannedMinutes"] for t in task_items)
    })

os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
with open(OUTPUT_JSON, "w") as f:
    json.dump({
        "metadata": {
            "title": "180-Day Software Engineering Interview Preparation Handbook",
            "startDate": "2026-10-14",
            "endDate": "2027-04-11",
            "totalDays": len(days_list),
            "dailyTargetMinutes": 180,
            "weeklyTargetHours": 21,
            "totalPlannedHours": 540,
            "university": "University of North Texas (UNT)",
            "visaStatus": "F-1",
            "targetInternship": "Summer 2027 Software Engineering"
        },
        "days": days_list
    }, f, indent=2)

print(f"Successfully generated {OUTPUT_JSON} with {len(days_list)} days!")
all_180 = all(d["totalPlannedMinutes"] == 180 for d in days_list)
print(f"All 180 days have exactly 180 planned minutes: {all_180}")
