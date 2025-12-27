import wave
import random
import struct
import math
import os

# Constants
SAMPLE_RATE = 44100
MAX_AMP = 32767.0

def save_wav(filename, data):
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        f.writeframes(b''.join(data))
    print(f"Generated {filename}")

def pink_noise(n_samples):
    # Voss-McCartney algorithm for pink noise
    data = []
    rows = [0.0] * 16
    running_sum = 0.0
    for i in range(n_samples):
        k = 0
        while ((i >> k) & 1) == 0:
            k += 1
        if k < 16:
            prev = rows[k]
            rows[k] = random.uniform(-1, 1)
            running_sum += rows[k] - prev
        
        # Add some white noise to fill gaps
        sample = (running_sum + random.uniform(-1, 1)) / 10.0
        data.append(sample)
    return data

def brown_noise(n_samples):
    data = []
    last = 0.0
    for _ in range(n_samples):
        white = random.uniform(-0.1, 0.1)
        last = (last + white)
        # leaky integrator to prevent drift
        last *= 0.99 
        data.append(last)
    return data

def rain_sound(duration=5, volume=0.5):
    n_samples = int(SAMPLE_RATE * duration)
    noise = pink_noise(n_samples)
    
    encoded = []
    for x in noise:
        # Clip
        val = max(-1, min(1, x * 2.0)) * volume
        encoded.append(struct.pack('h', int(val * MAX_AMP)))
    return encoded

def forest_sound(duration=5, volume=0.4):
    n_samples = int(SAMPLE_RATE * duration)
    # Wind background (low passed brown noise equivalent)
    bg = brown_noise(n_samples)
    
    # Birds (Sine chirps)
    birds = [0.0] * n_samples
    num_chirps = int(duration * 2) # 2 chirps per second avg
    
    for _ in range(num_chirps):
        start_idx = random.randint(0, n_samples - 5000)
        chirp_len = random.randint(1000, 3000)
        start_freq = random.uniform(2000, 4000)
        end_freq = start_freq + random.uniform(-500, 500)
        
        for i in range(chirp_len):
            if start_idx + i >= n_samples: break
            t = i / SAMPLE_RATE
            # Linear chirp
            freq = start_freq + (end_freq - start_freq) * (i / chirp_len)
            amp_env = math.sin(math.pi * (i / chirp_len)) # Simple sine window
            birds[start_idx + i] += math.sin(2 * math.pi * freq * t) * amp_env * 0.3

    final = []
    for i in range(n_samples):
        # Mix wind and birds
        mix = (bg[i] * 0.8) + (birds[i] * 0.4)
        val = max(-1, min(1, mix)) * volume
        final.append(struct.pack('h', int(val * MAX_AMP)))
    return final

def cafe_sound(duration=5, volume=0.5):
    # Simulate babble using modulated noise filters in speech range
    n_samples = int(SAMPLE_RATE * duration)
    # Base: filtered pink noise for "room tone"
    room = pink_noise(n_samples)
    
    babble = [0.0] * n_samples
    num_voices = 15
    
    for _ in range(num_voices):
        # A "voice" is a band-passed noise burst
        # Simplified: Sine wave AM modulated by low freq noise
        voice_pitch = random.uniform(150, 400) # Fundamental
        speed = random.uniform(2, 6) # Speech rate
        offset = random.randint(0, SAMPLE_RATE)
        
        for i in range(n_samples):
            # Formant-ish simul: harmonic stack
            t = i / SAMPLE_RATE
            carrier = (math.sin(2 * math.pi * voice_pitch * t) + 
                       0.5 * math.sin(2 * math.pi * voice_pitch * 2 * t))
            
            # Amplitude modulation (speech syllables)
            mod = (math.sin(2 * math.pi * speed * t + offset) + 1) / 2
            # Add randomness to mod
            if random.random() < 0.01:
                mod = 0 # pause
                
            babble[i] += carrier * mod * 0.1

    final = []
    for i in range(n_samples):
        # Mix room and babble
        mix = (room[i] * 0.1) + babble[i]
        val = max(-1, min(1, mix)) * volume
        final.append(struct.pack('h', int(val * MAX_AMP)))
    return final

if __name__ == "__main__":
    os.makedirs('public/sounds', exist_ok=True)
    
    print("Generating High Quality Rain...")
    save_wav('public/sounds/rain.wav', rain_sound(5, 0.5))
    
    print("Generating High Quality Forest...")
    save_wav('public/sounds/forest.wav', forest_sound(5, 0.5))
    
    print("Generating High Quality Cafe...")
    save_wav('public/sounds/cafe.wav', cafe_sound(5, 0.5))
