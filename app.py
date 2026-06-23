# app.py
from flask import Flask, jsonify, render_template
from datetime import datetime

app = Flask(__name__)

# 仮のデータ（後でデータベースに置き換えてもOK）
tasks = [
    {"id": 1, "title": "Gitの演習をする", "done": False},
    {"id": 2, "title": "Flaskを復習する", "done": True},
]

# 画面（HTML）を返すルート
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    # ↓↓↓ ここから実装する ↓↓↓
    #
    # 1. 現在時刻を取得する
    #    ヒント：datetime.now() を使う
    #    ヒント：strftime("%Y-%m-%d %H:%M:%S") で文字列に変換できる
    #
    # 2. タスクの総数を数える
    #    ヒント：len(tasks) を使う
    #
    # 3. 完了したタスク（done が True）の数を数える
    #    ヒント：リスト内包表記や for ループでカウントする
    #    例：[t for t in tasks if t["done"]] の長さを調べる
    #
    # 4. Step 1で決めたJSONの形（generated_at, total_count, done_count, tasks）
    #    に合わせて jsonify() で返す
    #
    # ↑↑↑ ここまで実装する ↑↑↑

    now = datetime.now()
    generated_at = now.strftime("%Y-%m-%d %H:%M:%S")

    total_count = len(tasks)

    done_count = len([t for t in tasks if t["done"]])

    return jsonify({
        "generated_at" : generated_at,
        "total_count" : total_count,
        "done_count" : done_count,
        "tasks" : tasks,
        "debug" : 1
    })
    pass

if __name__ == "__main__":
    app.run(debug=True)