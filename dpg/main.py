import dearpygui.dearpygui as dpg

def setup_ui():
    # 1. 创建 DPG 上下文
    dpg.create_context()

    # 2. 加载中文字体并绑定
    font_path = r"frontend_dpg/song.ttf"  # 或者 "frontend_dpg/song.ttf"
    with dpg.font_registry():
        default_font = dpg.add_font(
            font_path, 
            18,
            glyph_ranges=[
                dpg.mvFontRange_Chinese_Simplified_Common,
                dpg.mvFontRange_Chinese_Full
            ]
        )
    dpg.bind_font(default_font)

    # 3. 定义主窗口
    with dpg.window(
        tag="main_window",
        label="股票分析系统",
        pos=(0, 0),
        width=1400,
        height=900,
        no_resize=False
    ):
        # 在这里添加你的 UI 控件
        dpg.add_text("欢迎使用股票分析系统！中文显示正常。")
        # … 其它控件 …

    # 4. 创建视口（标题、大小）
    dpg.create_viewport(
        title="股票分析系统", 
        width=1400, 
        height=900
    )

    # 5. 设置 DPG 并展示视口
    dpg.setup_dearpygui()
    dpg.show_viewport()

    # 6. 将主窗口设为“主”窗口，保证其尺寸与视口一致
    dpg.set_primary_window("main_window", True)

    # 7. 启动主循环
    dpg.start_dearpygui()

    # 8. 销毁上下文
    dpg.destroy_context()

if __name__ == "__main__":
    setup_ui()
