import sys
from pathlib import Path

if len(sys.argv) < 2:
	print("No project directory provided.")
	sys.exit()


project = Path(sys.argv[1])
audio = project / 'audio'
audiotypes = ["bgm", "bgs", "se", "me"]
if not audio.exists() and not audio.is_dir():
	print("Not valid project directory.")
	sys.exit()

result = {}

for sub in audiotypes:
	subdir = audio / sub
	subr = set()
	if subdir.exists() and audio.is_dir():
		m4a = [x.stem for x in subdir.glob("*.m4a")]
		ogg = [x.stem for x in subdir.glob("*.ogg")]
		subr = (set(m4a).symmetric_difference(set(ogg)))
	result[sub] = subr

output = project / 'checkaudioresult.txt'
with output.open('w') as f:
	for sub in audiotypes:
		f.write(sub + ':\n')
		prefix = "    "
		r = result[sub]
		for fn in r:
			f.write(prefix + fn + '\n')
		f.write('\n')

print("Result wrote into " + output.name + " under project directory")