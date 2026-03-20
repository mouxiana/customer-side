from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5173"
HEADLESS = False
SLOW_MO_MS = 300
DEFAULT_TIMEOUT_MS = 15000


def log(message: str) -> None:
    print(f"[LOG] {message}")


def is_visible(locator) -> bool:
    try:
        return locator.count() > 0 and locator.first.is_visible()
    except Exception:
        return False


def first_visible_locator(page, selectors):
    for selector in selectors:
        locator = page.locator(selector)
        if is_visible(locator):
            return locator.first
    return None


def click_first_of(page, selectors, action_name: str) -> None:
    locator = first_visible_locator(page, selectors)
    if locator is None:
        raise RuntimeError(f"找不到可点击元素：{action_name}")
    locator.click()
    log(f"已点击：{action_name}")


def get_visible_button_texts(page, limit=40):
    texts = []

    try:
        buttons = page.locator("button")
        count = min(buttons.count(), limit)
        for i in range(count):
            try:
                btn = buttons.nth(i)
                if btn.is_visible():
                    text = btn.inner_text().strip()
                    if text:
                        texts.append(f"button:{text}")
            except Exception:
                pass
    except Exception:
        pass

    try:
        links = page.locator("a")
        count = min(links.count(), limit)
        for i in range(count):
            try:
                link = links.nth(i)
                if link.is_visible():
                    text = link.inner_text().strip()
                    if text:
                        texts.append(f"link:{text}")
            except Exception:
                pass
    except Exception:
        pass

    return texts


def wait_for_products_list(page) -> None:
    page.wait_for_load_state("domcontentloaded")
    page.wait_for_timeout(2000)

    candidates = [
        "article",
        "button:has-text('Add to Cart')",
        "img[alt]",
        "h2"
    ]
    for selector in candidates:
        locator = page.locator(selector)
        try:
            locator.first.wait_for(state="visible", timeout=6000)
            return
        except Exception:
            pass


def try_click_add_to_cart_button(page) -> bool:
    candidates = [
        "article button:has-text('Add to Cart')",
        "button:has-text('Add to Cart')",
        "button:has-text('加入购物车')",
        "button:has-text('Add')",
        "button:has-text('加入')",
        "[data-testid='add-to-cart']"
    ]

    for selector in candidates:
        locator = page.locator(selector)
        try:
            if locator.count() > 0 and locator.first.is_visible():
                locator.first.click()
                page.wait_for_timeout(1800)
                log(f"已点击加入购物车按钮：{selector}")
                return True
        except Exception:
            pass

    return False


def open_first_product_detail(page) -> bool:
    candidates = [
        "a[href^='/product/']",
        "a[href*='/product/']",
        "article",
        ".product-card",
        "img[alt]"
    ]

    for selector in candidates:
        locator = page.locator(selector)
        try:
            if locator.count() > 0 and locator.first.is_visible():
                locator.first.click()
                page.wait_for_load_state("domcontentloaded")
                page.wait_for_timeout(1500)
                if "/product/" in page.url:
                    log(f"已打开商品详情页：{page.url}")
                    return True
        except Exception:
            pass

    return False


def add_first_product_to_cart(page) -> None:
    log("开始：加入购物车")
    page.goto(f"{BASE_URL}/products")
    wait_for_products_list(page)

    if try_click_add_to_cart_button(page):
        return

    if open_first_product_detail(page):
        if try_click_add_to_cart_button(page):
            return

    visible = get_visible_button_texts(page)
    if visible:
        log("当前页面可见按钮/链接文本：" + " | ".join(visible))

    raise RuntimeError("商品页和商品详情页都找不到“加入购物车”按钮")


def open_cart(page) -> None:
    log("开始：进入购物车")
    click_first_of(
        page,
        [
            "a[href='/cart']",
            "text=Cart",
            "text=购物车",
            "text=購物車"
        ],
        "购物车入口"
    )

    page.wait_for_load_state("domcontentloaded")
    page.wait_for_timeout(1200)

    if "/cart" not in page.url:
        raise RuntimeError(f"点击购物车后并没有进入 /cart，当前 URL：{page.url}")

    log(f"已进入购物车页：{page.url}")


def select_cart_item_if_checkbox_exists(page) -> None:
    for selector in ["input[type='checkbox']", "[role='checkbox']"]:
        locator = page.locator(selector)
        try:
            if locator.count() > 0 and locator.first.is_visible():
                if selector == "input[type='checkbox']":
                    locator.first.check()
                else:
                    locator.first.click()
                log("已勾选第一个购物车商品")
                page.wait_for_timeout(500)
                return
        except Exception:
            pass

    log("购物车页面没有检测到勾选框，跳过勾选步骤")


def try_click_checkout_button(page) -> bool:
    selectors = [
        "button:has-text('Checkout')",
        "button:has-text('Place Order')",
        "button:has-text('Order Now')",
        "button:has-text('Buy Now')",
        "button:has-text('Proceed to Checkout')",
        "button:has-text('结算')",
        "button:has-text('下单')",
        "button:has-text('立即购买')",
        "button:has-text('提交订单')",
        "button:has-text('购买')",
        "aside button",
        "[class*='summary'] button"
    ]

    for selector in selectors:
        locator = page.locator(selector)
        try:
            if locator.count() > 0 and locator.first.is_visible() and locator.first.is_enabled():
                locator.first.click()
                page.wait_for_timeout(1800)
                log(f"已点击结算按钮：{selector}")
                return True
        except Exception:
            pass

    return False


def checkout_order(page) -> None:
    log("开始：下单流程")
    page.wait_for_load_state("domcontentloaded")
    page.wait_for_timeout(1200)

    if try_click_checkout_button(page):
        log(f"点击结算后当前 URL：{page.url}")
        return

    visible = get_visible_button_texts(page)
    if visible:
        log("当前页面可见按钮/链接文本：" + " | ".join(visible))

    raise RuntimeError("找不到可点击元素：结算按钮")


def wait_for_manual_login(page) -> None:
    log("开始：手动登录")
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("domcontentloaded")
    print()
    print("请在弹出的浏览器里手动登录。")
    print("登录成功并确认你能正常访问购物车后，回到终端按回车继续。")
    input()
    log(f"手动登录后当前 URL：{page.url}")


def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=HEADLESS, slow_mo=SLOW_MO_MS)
        context = browser.new_context()
        page = context.new_page()
        page.set_default_timeout(DEFAULT_TIMEOUT_MS)

        try:
            log("=== 测试开始 ===")
            wait_for_manual_login(page)
            add_first_product_to_cart(page)
            open_cart(page)
            select_cart_item_if_checkbox_exists(page)
            checkout_order(page)
            log("=== 测试结束：已执行到结算步骤 ===")
        finally:
            context.close()
            browser.close()


if __name__ == "__main__":
    run_test()