#!/usr/bin/env python3
"""Render the ProofSight demo video frames + ffmpeg concat list."""
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1920, 1080
BG = (11, 14, 20); PANEL = (18, 23, 34); INK = (232, 236, 243)
DIM = (154, 165, 184); ACC = (77, 163, 255); OK = (61, 220, 151); LINE = (35, 44, 61)
MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
SANSB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
OUT = os.path.join(os.path.dirname(__file__), 'frames')
os.makedirs(OUT, exist_ok=True)

def F(path, size): return ImageFont.truetype(path, size)

def card(name, draw_fn):
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    draw_fn(d)
    img.save(os.path.join(OUT, name))
    print(name)

def wrap(d, text, font, maxw):
    words, lines, cur = text.split(), [], ''
    for w_ in words:
        t = (cur + ' ' + w_).strip()
        if d.textlength(t, font=font) <= maxw: cur = t
        else: lines.append(cur); cur = w_
    if cur: lines.append(cur)
    return lines

def title(d):
    d.rounded_rectangle([560, 150, 1360, 196], 23, outline=ACC, width=2)
    t = 'CONCORDIUM TRUSTED AGENTS HACKATHON - ENCODE CLUB 2026'
    tw = d.textlength(t, font=F(MONO, 22))
    d.text(((W-tw)/2, 162), t, font=F(MONO, 22), fill=ACC)
    for i, line in enumerate(['ProofSight', 'verified agent-to-agent', 'commerce on Concordium']):
        f = F(SANSB, 84 if i == 0 else 64)
        tw = d.textlength(line, font=f)
        d.text(((W-tw)/2, 290 + i*96), line, font=f, fill=INK if i == 0 else DIM)
    sub = 'x402 CCD micropayments  |  Verified by Concordium badges  |  on-chain audit anchors'
    tw = d.textlength(sub, font=F(MONO, 26))
    d.text(((W-tw)/2, 640), sub, font=F(MONO, 26), fill=ACC)
    by = 'Septian Panjaya'
    tw = d.textlength(by, font=F(SANS, 28))
    d.text(((W-tw)/2, 900), by, font=F(SANS, 28), fill=DIM)

def why(d):
    d.text((120, 110), 'Agents need to know who they are paying', font=F(SANSB, 54), fill=INK)
    items = [
        ('1', 'Any agent can claim anything. ProofSight proves it:', 'a CIS-8004 registry entry and a Verified by Concordium badge,'),
        ('2', 'backed by an identity-verified human owner.', 'The buyer agent checks the badge before it pays a single microCCD.'),
        ('3', 'Payment is HTTP-native: x402, 1 CCD per report,', 'settled on Concordium testnet in seconds, fees sponsored.'),
        ('4', 'Every delivered report is hash-anchored on-chain,', 'an EU AI Act style audit record of agent output.'),
    ]
    y = 260
    for n, l1, l2 in items:
        d.ellipse([120, y, 176, y+56], outline=ACC, width=3)
        nw = d.textlength(n, font=F(SANSB, 30))
        d.text((148-nw/2, y+11), n, font=F(SANSB, 30), fill=ACC)
        d.text((210, y-2), l1, font=F(SANS, 34), fill=INK)
        d.text((210, y+48), l2, font=F(SANS, 34), fill=DIM)
        y += 150
    d.text((120, 950), 'Both the seller AND the buyer are registered, badge-verified agents.', font=F(MONO, 28), fill=OK)

def terminal(lines, name, note=None):
    def draw(d):
        d.rounded_rectangle([110, 80, 1810, 1000], 14, fill=PANEL, outline=LINE, width=2)
        for i, c in enumerate([(255,95,86),(255,189,46),(39,201,63)]):
            d.ellipse([140+i*36, 108, 162+i*36, 130], fill=c)
        d.text((250, 104), 'proofsight - demo', font=F(MONO, 24), fill=DIM)
        f = F(MONO, 26)
        y = 170
        for ln in lines[-26:]:
            col = INK
            if ln.startswith('$'): col = ACC
            elif 'badge_valid: true' in ln or '200' == ln.split(':')[-1].strip() or ln.startswith('# '): col = OK
            elif ln.startswith('first response'): col = (255, 189, 46)
            d.text((140, y), ln[:118], font=f, fill=col)
            y += 31
        if note:
            nw = d.textlength(note, font=F(MONO, 24))
            d.rounded_rectangle([W-160-nw, 40, W-120, 76], 8, fill=(20, 40, 32))
            d.text((W-140-nw, 46), note, font=F(MONO, 24), fill=OK)
    card(name, draw)

def shot(png, caption, name):
    def draw(d):
        im = Image.open(png).convert('RGB')
        maxw, maxh = 1760, 880
        r = min(maxw/im.width, maxh/im.height)
        im = im.resize((int(im.width*r), int(im.height*r)))
        d.rounded_rectangle([(W-im.width)//2-6, 84, (W+im.width)//2+6, 90+im.height], 10, outline=LINE, width=2)
        d._image.paste(im, ((W-im.width)//2, 90))
        lines = wrap(d, caption, F(SANS, 32), 1600)
        y = 1000 - len(lines)*44
        for ln in lines:
            tw = d.textlength(ln, font=F(SANS, 32))
            d.text(((W-tw)/2, y), ln, font=F(SANS, 32), fill=INK); y += 44
    card(name, draw)

def mainnet(d):
    d.text((120, 110), 'Path to mainnet', font=F(SANSB, 54), fill=ACC)
    bullets = [
        'The Agent Registry (CIS-8004), CIS-8 key registry and badge flow are Concordium',
        'platform services that already exist on mainnet - moving is a config change.',
        '',
        'The economics already work: 1 CCD per report is real revenue; facilitator fee',
        'sponsorship is a customer-acquisition cost that can be priced in.',
        '',
        'Identity is the differentiator: on mainnet a buyer can require a valid Concordium',
        'badge - an identity-verified human behind the agent - before paying anything.',
        '',
        'Next: buyer-side badge policy hooks, dispute evidence from audit anchors,',
        'and payment in a Concordium PLT stablecoin once available.',
    ]
    y = 240
    for b in bullets:
        d.text((140, y), b, font=F(SANS, 34), fill=INK if b else BG); y += 58

def closing(d):
    t = 'Everything on Concordium testnet, verifiable today'
    tw = d.textlength(t, font=F(SANSB, 46)); d.text(((W-tw)/2, 220), t, font=F(SANSB, 46), fill=INK)
    rows = [
        ('Live site', 'https://proofsight.pages.dev'),
        ('Source', 'https://github.com/dannytungadi5/proofsight-agent'),
        ('Seller badge', 'JyP9XuZ1MiqWZV82gCRTo  (token 1493, Active)'),
        ('Buyer badge', 'JyP9Y27twsq5YEYidFCan  (token 1499, Active)'),
        ('Verify', 'agent-registry-mcp.concordium.com/v1/badge-check/<badge>?network=testnet'),
    ]
    y = 360
    for k, v in rows:
        d.text((380, y), k, font=F(MONO, 30), fill=DIM)
        d.text((720, y), v, font=F(MONO, 30), fill=ACC if k in ('Live site','Source') else INK)
        y += 80
    t2 = 'Septian Panjaya - Concordium Trusted Agents Hackathon'
    tw = d.textlength(t2, font=F(SANS, 30)); d.text(((W-tw)/2, 900), t2, font=F(SANS, 30), fill=DIM)

# ---- build ----
card('01-title.png', title)
card('02-why.png', why)

run = open(os.path.expanduser('~/concordium-hackathon/out/demo-run.txt')).read().splitlines()
# progressive terminal frames
chunks = [(6, None), (10, None), (13, None), (22, None), (len(run), 'settled on-chain')]
for i, (n, note) in enumerate(chunks):
    terminal(run[:n], f'03-term{i}.png', note)

DL = '/downloads'
shot(f'{DL}/cloud-browser-20261125-064041.png',
     'The Concordium Agent Registry verifies ProofSight\'s badge: all 15 checks pass, badge_valid = true.',
     '04-badge.png')
shot(f'{DL}/cloud-browser-20261125-064036.png',
     'The x402 payment, settled on Concordium testnet: 1 CCD buyer to seller, network fee sponsored by the facilitator.',
     '05-payment.png')
shot(f'{DL}/cloud-browser-20261125-064104.png',
     'The audit anchor: the delivered report\'s SHA-256 written on-chain with RegisterData. Permanent, tamper-proof.',
     '06-anchor.png')
shot(f'{DL}/cloud-browser-20261125-064029.png',
     'The public project page: proofsight.pages.dev, with every transaction linked and verifiable.',
     '07-site.png')
card('08-mainnet.png', mainnet)
card('09-closing.png', closing)

durations = [('01-title.png',5),('02-why.png',11),('03-term0.png',5),('03-term1.png',5),
             ('03-term2.png',5),('03-term3.png',8),('03-term4.png',7),('04-badge.png',8),
             ('05-payment.png',8),('06-anchor.png',8),('07-site.png',6),('08-mainnet.png',12),('09-closing.png',6)]
with open(os.path.join(OUT, 'list.txt'), 'w') as f:
    for n, d_ in durations:
        f.write(f"file '{n}'\nduration {d_}\n")
    f.write(f"file '{durations[-1][0]}'\n")
print('total seconds:', sum(d for _, d in durations))
