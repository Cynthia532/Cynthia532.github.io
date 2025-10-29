## How to config?

**Windows + WSL**

```bash
sudo apt update
sudo apt install ruby-full build-essential zlib1g-dev
```

gems.sh (for path configuration)

```bash
export GEM_HOME="$HOME/gems
export PATH="$HOME/gems/bin:$PATH
```

**Install Jekyll and Bundler**

```bash
source gems.sh
gem install jekyll bundler
```

**Initial gems**:

Gemfile

```bash
source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins
```

**Start Server**

```bash
cd Cynthia532.github.io
bundle exec jekyll serve
```
