import os,re
from playwright.sync_api import Playwright, sync_playwright, expect
from dotenv import load_dotenv
# Load environment variables from .env file
load_dotenv()
ID=os.getenv("ID")
PW=os.getenv("PW")

def run(playwright: Playwright) -> None:
    browser = playwright.chromium.launch(headless=False)
    context = browser.new_context()
    page = context.new_page()
    page.goto("https://www.yeoshin.co.kr/")
    page.get_by_role("button", name="Close Message").click()
    page.get_by_role("link", name="마이 마이").click()
    page.get_by_role("link", name="로그인 / 회원가입").click()
    page.get_by_role("button", name="svg NAVER로 로그인").click()
    page.get_by_role("textbox", name="아이디 또는 전화번호").click()
    page.get_by_role("textbox", name="아이디 또는 전화번호").fill(ID)
    page.get_by_role("textbox", name="비밀번호").click()
    page.get_by_role("textbox", name="비밀번호").fill(PW)
    page.get_by_role("button", name="로그인").click()
    if page.get_by_role("button", name="Close Message").is_visible():
        page.get_by_role("button", name="Close Message").click()
    page.get_by_role("link", name="마이 마이").click()
    expect(page.get_by_text("포인트")).to_be_visible()
    expect(page.locator("#ct-view")).to_contain_text("포인트")

    # ---------------------
    context.close()
    browser.close()


with sync_playwright() as playwright:
    run(playwright)
