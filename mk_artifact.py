"""Artifact 用のコピー：埋め込みライブラリの中の U+FFFD（文字列の中）を \\uFFFD に書き換える（JS としては同じ意味）"""
import pathlib
here = pathlib.Path(__file__).parent / '_test'
s = (here.parent / '生産管理システム.html').read_text(encoding='utf-8')
t = s.replace('�', '\\uFFFD')
(here / 'artifact.html').write_text(t, encoding='utf-8')
print(s.count('�'), t.count('�'), t.count('\\uFFFD'))
