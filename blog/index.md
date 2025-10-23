---
layout: default
title: Blog
---

# 📝 Blog

<div data-lang="en">
Welcome to my blog!  
Here I share my learning notes, reflections, and research insights.
</div>

<div data-lang="zh" style="display:none;">
欢迎来到我的博客！  
这里记录了我的学习笔记、思考与研究体会。
</div>

---

{% for post in site.posts %}
- [{{ post.title }}]({{ post.url }}) — {{ post.date | date: "%Y-%m-%d" }}
{% endfor %}
