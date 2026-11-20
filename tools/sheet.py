import sys,glob
from PIL import Image, ImageDraw
d,out=sys.argv[1],sys.argv[2]; fs=sorted(glob.glob(d+'/f*.jpg')); cols=int(sys.argv[3]) if len(sys.argv)>3 else 6
w,h=270,480; rows=(len(fs)+cols-1)//cols; S=Image.new('RGB',(cols*w,rows*(h+24)),'white'); D=ImageDraw.Draw(S)
for i,f in enumerate(fs):
  im=Image.open(f).resize((w,h)); x,y=(i%cols)*w,(i//cols)*(h+24); S.paste(im,(x,y+24)); D.text((x+4,y+4),f.split('/')[-1],fill='black')
S.save(out,quality=88)
