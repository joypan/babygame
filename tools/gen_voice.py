"""產生遊戲語音 mp3（微軟 Edge TTS，en-US-AnaNeural 小女孩聲）。

用法：python tools/gen_voice.py
輸出：voice/*.mp3，檔名對應 index.html 的 speak(key)：
  abc_A   「A is for Apple.」         探索頁字母
  word_A  「Apple.」                  探索頁點小圖
  num_1   「one apple.」              探索頁數字
  count_1 「one.」                    探索頁數字點小圖數數
  find_A / find_1  「A! Where is A?」  找找看題目（先單獨唸一次，避免 Find R 連音成 finder）
  yay_A   「Yay! A is for Apple.」    找找看答對（字母）
  yay_1   「Yay! one!」               找找看答對（數字）
句子內容與 index.html 的 LETTERS / NUMBER_WORDS / NUMBER_NOUNS 對齊，改資料時兩邊一起改。
需要網路；只在新增/修改句子時跑一次，mp3 進 repo。
"""
import asyncio
import pathlib

import edge_tts

VOICE = "en-US-AnaNeural"
RATE = "-10%"     # 稍慢，小小孩聽得清楚
OUT = pathlib.Path(__file__).resolve().parent.parent / "voice"

LETTERS = [
    ("A", "Apple"), ("B", "Banana"), ("C", "Cat"), ("D", "Dog"), ("E", "Elephant"), ("F", "Fish"),
    ("G", "Grapes"), ("H", "Hat"), ("I", "Ice cream"), ("J", "Juice"), ("K", "Kite"), ("L", "Lion"),
    ("M", "Monkey"), ("N", "Nose"), ("O", "Orange"), ("P", "Pig"), ("Q", "Queen"), ("R", "Rabbit"),
    ("S", "Sun"), ("T", "Tiger"), ("U", "Umbrella"), ("V", "Violin"), ("W", "Watermelon"),
    ("X", "Xylophone"), ("Y", "Yo-yo"), ("Z", "Zebra"),
]
NUMBER_WORDS = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]
NUMBER_NOUNS = ["apple", "chicks", "balloons", "stars", "strawberries", "fish", "flowers", "cookies", "frogs", "cars"]


def phrases():
    for g, w in LETTERS:
        yield f"abc_{g}", f"{g} is for {w}."
        yield f"word_{g}", f"{w}."
        yield f"find_{g}", f"{g}! Where is {g}?"
        yield f"yay_{g}", f"Yay! {g} is for {w}."
    for i, w in enumerate(NUMBER_WORDS):
        n = i + 1
        yield f"num_{n}", f"{w} {NUMBER_NOUNS[i]}."
        yield f"count_{n}", f"{w}."
        yield f"find_{n}", f"{w.capitalize()}! Where is {w}?"
        yield f"yay_{n}", f"Yay! {w}!"


async def gen(sem, key, text):
    async with sem:
        path = OUT / f"{key}.mp3"
        await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(path))
        print(f"{key:10s} {text}")


async def main():
    OUT.mkdir(exist_ok=True)
    sem = asyncio.Semaphore(6)   # 同時太多連線會被擋
    await asyncio.gather(*(gen(sem, k, t) for k, t in phrases()))


if __name__ == "__main__":
    asyncio.run(main())
