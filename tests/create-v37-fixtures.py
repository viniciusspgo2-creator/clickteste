from pathlib import Path
import struct,zlib
repo=Path(__file__).resolve().parent
out=repo/'fixtures';out.mkdir(exist_ok=True)
def layer(name,top,left,w,h,rgb,compression):
    n=w*h;info=struct.pack('>iiiiH',top,left,top+h,left+w,4)
    px=[]
    for index,value in zip((0,1,2,-1),(*rgb,255)):
        raw=bytes([value])*n
        if compression==2: block=struct.pack('>H',2)+zlib.compress(raw)
        elif compression==3:
            encoded=bytearray(raw)
            for y in range(h):
                for x in range(w-1,0,-1):encoded[y*w+x]=(encoded[y*w+x]-encoded[y*w+x-1])&255
            block=struct.pack('>H',3)+zlib.compress(encoded)
        else: block=struct.pack('>H',0)+raw
        info+=struct.pack('>hI',index,len(block));px.append(block)
    pascal=bytes([len(name)])+name.encode('latin1');pascal+=b'\0'*((-len(pascal))%4)
    extra=struct.pack('>II',0,0)+pascal
    info+=b'8BIM'+b'norm'+bytes([255,0,0,0])+struct.pack('>I',len(extra))+extra
    return info,b''.join(px)
A,pa=layer('zip-blue',0,0,16,8,(0,0,255),2)
B,pb=layer('predict-green',8,16,16,8,(0,255,0),3)
inner=struct.pack('>h',2)+A+B+pa+pb
section=struct.pack('>I',len(inner))+inner
header=b'8BPS'+struct.pack('>H',1)+b'\0'*6+struct.pack('>HIIHH',3,16,32,8,3)
psd=header+struct.pack('>I',0)+struct.pack('>I',0)+struct.pack('>I',len(section))+section+struct.pack('>I',0)+b'\0'*2
(out/'sample-zip-prediction.psd').write_bytes(psd)
print('fixture',len(psd))
