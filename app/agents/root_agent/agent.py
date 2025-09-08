from google.adk.agents import Agent

from app import tools
from app.models import main_model

from .prompts import PROMPT

root_agent = Agent(
    name="root_agent",
    model=main_model,
    description="体贴的生活助手。",
    instruction=PROMPT,
    tools=[tools.get_city_code_by_name, tools.get_weather_now, tools.get_weather_days],
)
