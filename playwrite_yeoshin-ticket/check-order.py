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
    page.get_by_role("textbox", name="피부 고민, 시술을 찾아보세요!").click()
    page.get_by_role("textbox", name="피부 고민, 시술을 찾아보세요!").fill("지우의원")
    page.locator(".absolute > svg").first.click()
    page.get_by_role("button", name="병원 999+").click()
    with page.expect_popup() as page1_info:
        page.get_by_role("button").filter(has_text="지우의원강남역 12번 출구에서 도보 1분9.4(3K").click()
    page1 = page1_info.value
    page1.get_by_text("포텐자").click()
    expect(page1.locator("#ct-view")).to_contain_text("VAT 포함")
    page1.get_by_role("button", name="구매하기").click()
    page1.get_by_text("A 포텐자", exact=True).click()
    page1.get_by_role("button", name="구매하기").click()
    page1.get_by_role("button", name="위 내용을 확인했으며, 결제에 동의합니다").click()
    page1.get_by_role("button", name="결제하기").click()
    with page1.expect_popup() as page2_info:
        page1.locator("#imp-iframe").content_frame.get_by_role("button", name="다음").click()
    page2 = page2_info.value
    expect(page2.locator("#container")).to_contain_text("포텐자")
    expect(page2.get_by_role("heading", name="결제상품")).to_be_visible()

    # ---------------------
    context.close()
    browser.close()


with sync_playwright() as playwright:
    run(playwright)
