# *Sonic CD* (Retro Engine) save file format

This is a specification for the save file format used by the 2011 Retro Engine remake of *Sonic CD*, released in 2011 for Windows and various console and mobile platforms. This specification refers primarily to the Windows version but may accurately describe other platforms as well.

This document uses the following terms to represent data sizes, consistent with their use in Win32 API:

| Term | Length | Range |
| - | - | - |
| **BYTE** | 1 byte (8 bits) | 0–255 |
| **WORD** | 2 bytes (16 bits) |0–65,535 |
| **DWORD** | 4 bytes (32 bits) | 0–4,294,967,295 |

All numbers are little endian integers, meaning that the word `$FF00` has the decimal value of 255 and not 65,280.

## Overview

The file is named "sdata.bin" on Windows and "sgame.bin" on Android and iOS. On Windows, the file is located in `C:\Program Files (x86)\Steam\userdata\[identifier]\200940\local\sdata.bin`. The game can save up to 4 different save slots in a single save file. The file is always 32,768 bytes in length.

The file is divided into the following sections:

| Offset | Size | Description |
| - | - | - |
| `$0000`–`$001F` | 32 bytes | Slot 1 |
| `$0020`–`$003F` | 32 bytes | Slot 2 |
| `$0040`–`$005F` | 32 bytes | Slot 3 |
| `$0060`–`$007F` | 32 bytes | Slot 4 |
| `$0080`–`$009F` | 32 bytes | Options |
| `$00A0`–`$00BF` | 32 bytes | Always 0 |
| `$00C0`–`$02B7` | 504 bytes | *Time Attack* times |
| `$02B8`–`$8000` | 32,072 bytes | Always 0 |

## Slot contents

Each slot is 32 bytes long. Offsets are given relative to the beginning of the slot. The first slot starts at the beginning of the file; the *n*th slot is offset by (*n* − 1) × 32 bytes.

| Offset | Size | Format | Description |
| - | - | - | - |
| `$0000` | **BYTE** | Number | Character |
| `$0004` | **BYTE** | Number | Lives |
| `$0008`–`$000B` | **DWORD** | Number | Score |
| `$000C` | **BYTE** | Number | Current stage |
| `$001C`–`$001D` | **WORD** | Bit field | Robot transporter machines destroyed |
| `$001E` | **BYTE** | Number | Metal Sonic holograms destroyed |
| `$0010` | **BYTE** | Bit field | Time Stones |
| `$0014` | **BYTE** | Number | Next Special Zone |
| `$0018`–`$001B` | **DWORD** | Number | Next extra life score |

All other bytes are zero.

### Character

`$00` for Sonic, `$01` for Tails.

### Lives

The number of extra lives, between 0 and 255 (`$FF`). The largest value that the game can properly display is 99 (`$63`); higher values have their most significant digit truncated.

### Score

The current score as a 32-bit integer. The largest value that the game can properly display is 999,999 (`$3F420F`); higher values have their most significant digit truncated. Extremely large values may not display at all.

### Current stage

New games have a value of `$00`. Save slots with a value of `$00` here are ignored by the game and treated as empty regardless of the contents of the rest of the data.

If greater than zero, it represents the current stage. This value is calculated from two components, the Round and the Zone, including the time period.

The Rounds are:

| Value | Round |
| - | - |
| 0 | Palmtree Panic |
| 1 | Collision Chaos |
| 2 | Tidal Tempest |
| 3 | Quartz Quadrant |
| 4 | Wacky Workbench |
| 5 | Stardust Speedway |
| 6 | Metallic Madness |
| 7 | Metallic Madness |

The Zones are:

| Value | Zone |
| - | - |
| 1 | Zone I Present |
| 2 | Zone I Past |
| 3 | Zone I Good Future |
| 4 | Zone I Bad Future |
| 5 | Zone II Present |
| 6 | Zone II Past |
| 7 | Zone II Good Future |
| 8 | Zone II Bad Future |
| 9 | Zone III Good Future |
| 10 | Zone III Bad Future |

The stage value is given by *Round* × 10 + *Zone*.

The lowest value is `$01` for Palmtree Panic I Present. The highest value is `$46` for Metallic Madness Zone III Bad Future.

It is possible to save and continue a game in a Special Zone. If in a Special Zone, the stage value is increased by `$50`. The game loads the Special Zone given by the *Next Special Zone* byte and continues the game afterwards from the stage specified by this value minus `$50`. For example, `$52` continues the game from `$02` (Palmtree Panic I Past) after the Special Zone is played.

### Robot transporter machines destroyed

Tracks which robot transporter machines have been destroyed by the player. Robot transporter machines appear in Zone I Past and Zone II Past stages of all Rounds. Destroying both of them awards the player with a Good Future for that Round.

This value is used to determine the good ending (which can be obtained by either creating a Good Future in each Round or by collecting all of the Time Stones) and for the "Saviour of the Planet" achievement.

It is stored as a bit field of fourteen bits, each representing the first two Zones of each of the game's seven Rounds, starting with the least significant bit:

```
0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1
    | | | | | | | | | | | | | |
    | | | | | | | | | | | | | Palmtree Panic I
    | | | | | | | | | | | | Palmtree Panic II
    | | | | | | | | | | | Collison Chaos I
    | | | | | | | | | | Collision Chaos II
    | | | | | | | | | Tidal Tempest I
    | | | | | | | | Tidal Tempest II
    | | | | | | | Quartz Quadrant I
    | | | | | | Quartz Quadrant II
    | | | | | Wacky Workbench I
    | | | | Wacky Workbench II
    | | | Stardust Speedway I
    | | Stardust Speedway II
    | Metallic Madness I
    Metallic Madness II
```

This can also be expressed as a sum of the powers of 2:

| Round | Value |
| - | - |
| Palmtree Panic I | 1 |
| Palmtree Panic II | 2 |
| Collision Chaos I | 4 |
| Collision Chaos II | 8 |
| Tidal Tempest I | 16 |
| Tidal Tempest II | 32 |
| Quartz Quadrant I | 64 |
| Quartz Quadrant II | 128 |
| Wacky Workbench I | 256 |
| Wacky Workbench II | 512 |
| Stardust Speedway I | 1024 |
| Stardust Speedway II | 2048 |
| Metallic Madness I | 4096 |
| Metallic Madness II | 8192 |

A value of `$FF3F` means that all of the machines have been destroyed.

### Metal Sonic holograms destroyed

A number between `$00` and `$0C`, tracking how many Metal Sonic holograms that the player has destroyed. Metal Sonic holograms appear in Zone I Past and Zone II Past stages of all Rounds except Metallic Madness.

Holograms do not contribute toward Good Futures or the good ending but are tracked by the game for the "Saviour of the Planet" achievement.

### Time Stones

Tracks the Time Stones collected by the player. Each Time Stone is associated with a particular Special Zone, so they can be collected out of order if the player fails a Special Zone.

This is stored as a bit field of seven bits, each representing one Time Stone, starting with the least significant bit:

```
0 1 1 1 1 1 1 1
  | | | | | | |
  | | | | | | Green
  | | | | | Orange
  | | | | Yellow
  | | | Blue
  | | Cyan
  | Purple
  Red
```

This can also be expressed as a sum of the powers of 2:

| Time Stone | Value |
| - | - |
| Green | 1 |
| Orange | 2 |
| Yellow | 4 |
| Blue | 8 |
| Cyan | 16 |
| Purple | 32 |
| Red | 64 |

A value of `$7F` means that all of the Time Stones have been collected.

### Next Special Zone

The next Special Zone to be played, between `$00` and `$06`. The game goes through all of the Special Zones in rotation, skipping the ones that have already been successfully completed.

Unlike other version of the game, this value is not set to `$00` after the player has collected all of the Time Stones but stays the value of the last completed Special Zone.

It is possible to set this value to that of a Special Zone that has already been completed. In this case, the selected Special Zone will be played next but will not award another Time Stone if completed successfully (since each Special Zone is associated with a particular Time Stone).

### Next extra life score

The game rewards the player with an extra life every 50,000 points. This value stores the next multiple of 50,000 at which the player is given an extra life. Its initial value is `$50C3` (50,000).

This value can be calculated by *score* + (50,000 − *score* mod 50,000). For a score of 126,400, for example, this gives a next extra life score value of 150,000.

If this value is set to a value lower than the score value, the player is awarded with extra lives for every multiple in between at the start of the game. For example, if the player has a score of 167,000 but the next extra life value is 0, the player will be given three extra lives for 50,000, 100,000, and 150,000 as soon as the game begins.

## *Time Attack* times

| Offset | Size | Format | Description |
| - | - | - | - |
| `$00C0`–`$02B7` | 504 bytes | Section | *Time Attack* |

The game stores three different time positions for each of the 21 Zones and 7 Special Zones, stored in an interpolated order with numerous unused slots. See **Appendix A** for a complete list of *Time Attack* time position offsets.

Each position consists of a **DWORD** number for the time in ticks. Default value is `$3075`, representing 5 minutes in ticks (5 × 60 × 100).

Time in *Sonic CD* is kept in minutes, seconds, and ticks. Ticks are 1/60 of a second but displayed in-game as 1/100 of a second. The Retro version of the game stores ticks as 1/100 of a second but only uses the values ⌊ 100 × *tick* / 60 ⌋ for *tick* = 1 to 60.

The default value is `$3075` for 5 minutes.

Unlike other versions of the game, this version does not store initials for each time.

## Options

| Offset | Size | Format | Description |
| - | - | - | - |
| `$0084` | **BYTE** | Number | Music volume |
| `$0088` | **BYTE** | Number | Sound effects volume |
| `$008C` | **BYTE** | Number | Spin dash style |
| `$0090` | **BYTE** | Number | Tails unlocked |
| `$0094` | **BYTE** | Number | Video filter |
| `$0098` | **BYTE** | Number | Soundtrack selection |
| `$009C` | **BYTE** | Number | Completed Rounds |

### Music and sound effects volume

For the Windows version, there are ten possible values (in increments of `$01`):

| Value | Volume |
| - | - |
| `$00` | Mute |
| `$01` | Quietest |
| `$02` | |
| `$03` | |
| `$04` | |
| `$05` | |
| `$06` | |
| `$07` | |
| `$08` | |
| `$09` | Loudest |

For the Android and iOS versions, there are eleven possible values (in increments of `$0A`):

| Value | Volume |
| - | - |
| `$00` | Mute |
| `$0A` | Quietest |
| `$14` | |
| `$1E` | |
| `$28` | |
| `$32` | |
| `$3C` | |
| `$46` | |
| `$50` | |
| `$5A` | |
| `$64` | Loudest |

### Spin dash style

`$00` for the original *Sonic CD* style, `$01` for the *Sonic 2* style.

This value is set to `$01` by default.

### Tails unlocked

`$00` for locked, `$01` for unlocked.

This value is set to `$00` by default but set to `$01` upon completing the game for the first time.

### Video filter

`$00` for the "Sharp" video filter, `$01` for the "Smooth" video filter, `$02` for the "Nostalgia" video filter.

This value is set to `$00` by default.

### Soundtrack selection

`$00` for the original Japanese soundtrack, `$01` for the American soundtrack.

This value is set to `$00` by default.

### Completed Rounds

This value determines which levels are unlocked in *Time Attack* mode. Possible values:

| Value | Round |
| - | - |
| `$00` | *Time Attack* not available |
| `$01` | Palmtree Panic |
| `$02` | Collision Chaos |
| `$03` | Tidal Tempest |
| `$04` | Quartz Quadrant |
| `$05` | Wacky Workbench |
| `$06` | Stardust Speedway |
| `$07` | Metallic Madness |

Completed games have a value of `$07`.

## Appendices

### A. *Time Attack* offsets

| Offset | Size | Format | Description |
| - | - | - | - |
| `$00C0`–`$00C3` | **DWORD** | Number | Palmtree Panic I, 1st place time |
| `$00C4`–`$00C7` | **DWORD** | Number | Special Zone 1, 1st place time |
| `$00C8`–`$00CB` | **DWORD** | Number | Palmtree Panic I, 2nd place time |
| `$00CC`–`$00CF` | **DWORD** | Number | Special Zone 1, 2nd place time |
| `$00D0`–`$00D3` | **DWORD** | Number | Palmtree Panic I, 3rd place time |
| `$00D4`–`$00D7` | **DWORD** | Number | Special Zone 1, 3rd place time |
| `$00D8`–`$00DB` | **DWORD** | Number | Palmtree Panic II, 1st place time |
| `$00DC`–`$00DF` | **DWORD** | Number | Unused |
| `$00E0`–`$00E3` | **DWORD** | Number | Palmtree Panic II, 2nd place time |
| `$00E4`–`$00E7` | **DWORD** | Number | Unused |
| `$00E8`–`$00EB` | **DWORD** | Number | Palmtree Panic II, 3rd place time |
| `$00EC`–`$00EF` | **DWORD** | Number | Unused |
| `$00F0`–`$00F3` | **DWORD** | Number | Palmtree Panic III, 1st place time |
| `$00F4`–`$00F7` | **DWORD** | Number | Unused |
| `$00F8`–`$00FB` | **DWORD** | Number | Palmtree Panic III, 2nd place time |
| `$00FC`–`$00FF` | **DWORD** | Number | Unused |
| `$0100`–`$0103` | **DWORD** | Number | Palmtree Panic III, 3rd place time |
| `$0104`–`$0107` | **DWORD** | Number | Unused |
| `$0108`–`$010B` | **DWORD** | Number | Collision Chaos I, 1st place time |
| `$010C`–`$010F` | **DWORD** | Number | Special Zone 2, 1st place time |
| `$0110`–`$0113` | **DWORD** | Number | Collision Chaos I, 2nd place time |
| `$0114`–`$0117` | **DWORD** | Number | Special Zone 2, 2nd place time |
| `$0118`–`$011B` | **DWORD** | Number | Collision Chaos I, 3rd place time |
| `$011C`–`$011F` | **DWORD** | Number | Special Zone 2, 3rd place time |
| `$0120`–`$0123` | **DWORD** | Number | Collision Chaos II, 1st place time |
| `$0124`–`$0127` | **DWORD** | Number | Unused |
| `$0128`–`$012B` | **DWORD** | Number | Collision Chaos II, 2nd place time |
| `$012C`–`$012F` | **DWORD** | Number | Unused |
| `$0130`–`$0133` | **DWORD** | Number | Collision Chaos II, 3rd place time |
| `$0134`–`$0137` | **DWORD** | Number | Unused |
| `$0138`–`$013B` | **DWORD** | Number | Collision Chaos III, 1st place time |
| `$013C`–`$013F` | **DWORD** | Number | Unused |
| `$0140`–`$0143` | **DWORD** | Number | Collision Chaos III, 2nd place time |
| `$0144`–`$0147` | **DWORD** | Number | Unused |
| `$0148`–`$014B` | **DWORD** | Number | Collision Chaos III, 3rd place time |
| `$014C`–`$014F` | **DWORD** | Number | Unused |
| `$0150`–`$0153` | **DWORD** | Number | Tidal Tempest I, 1st place time |
| `$0154`–`$0157` | **DWORD** | Number | Special Zone 3, 1st place time |
| `$0158`–`$015B` | **DWORD** | Number | Tidal Tempest I, 2nd place time |
| `$015C`–`$015F` | **DWORD** | Number | Special Zone 3, 2nd place time |
| `$0160`–`$0163` | **DWORD** | Number | Tidal Tempest I, 3rd place time |
| `$0164`–`$0167` | **DWORD** | Number | Special Zone 3, 3rd place time |
| `$0168`–`$016B` | **DWORD** | Number | Tidal Tempest II, 1st place time |
| `$016C`–`$016F` | **DWORD** | Number | Unused |
| `$0170`–`$0173` | **DWORD** | Number | Tidal Tempest II, 2nd place time |
| `$0174`–`$0177` | **DWORD** | Number | Unused |
| `$0178`–`$017B` | **DWORD** | Number | Tidal Tempest II, 3rd place time |
| `$017C`–`$017F` | **DWORD** | Number | Unused |
| `$0180`–`$0183` | **DWORD** | Number | Tidal Tempest III, 1st place time |
| `$0184`–`$0187` | **DWORD** | Number | Unused |
| `$0188`–`$018B` | **DWORD** | Number | Tidal Tempest III, 2nd place time |
| `$018C`–`$018F` | **DWORD** | Number | Unused |
| `$0190`–`$0193` | **DWORD** | Number | Tidal Tempest III, 3rd place time |
| `$0194`–`$0197` | **DWORD** | Number | Unused |
| `$0198`–`$019B` | **DWORD** | Number | Quartz Quadrant I, 1st place time |
| `$019C`–`$019F` | **DWORD** | Number | Special Zone 4, 1st place time |
| `$01A0`–`$01A3` | **DWORD** | Number | Quartz Quadrant I, 2nd place time |
| `$01A4`–`$01A7` | **DWORD** | Number | Special Zone 4, 2nd place time |
| `$01A8`–`$01AB` | **DWORD** | Number | Quartz Quadrant I, 3rd place time |
| `$01AC`–`$01AF` | **DWORD** | Number | Special Zone 4, 3rd place time |
| `$01B0`–`$01B3` | **DWORD** | Number | Quartz Quadrant II, 1st place time |
| `$01B4`–`$01B7` | **DWORD** | Number | Unused |
| `$01B8`–`$01BB` | **DWORD** | Number | Quartz Quadrant II, 2nd place time |
| `$01BC`–`$01BF` | **DWORD** | Number | Unused |
| `$01C0`–`$01C3` | **DWORD** | Number | Quartz Quadrant II, 3rd place time |
| `$01C4`–`$01C7` | **DWORD** | Number | Unused |
| `$01C8`–`$01CB` | **DWORD** | Number | Quartz Quadrant III, 1st place time |
| `$01CC`–`$01CF` | **DWORD** | Number | Unused |
| `$01D0`–`$01D3` | **DWORD** | Number | Quartz Quadrant III, 2nd place time |
| `$01D4`–`$01D7` | **DWORD** | Number | Unused |
| `$01D8`–`$01DB` | **DWORD** | Number | Quartz Quadrant III, 3rd place time |
| `$01DC`–`$01DF` | **DWORD** | Number | Unused |
| `$01E0`–`$01E3` | **DWORD** | Number | Wacky Workbench I, 1st place time |
| `$01E4`–`$01E7` | **DWORD** | Number | Special Zone 5, 1st place time |
| `$01E8`–`$01EB` | **DWORD** | Number | Wacky Workbench I, 2nd place time |
| `$01EC`–`$01EF` | **DWORD** | Number | Special Zone 5, 2nd place time |
| `$01F0`–`$01F3` | **DWORD** | Number | Wacky Workbench I, 3rd place time |
| `$01F4`–`$01F7` | **DWORD** | Number | Special Zone 5, 3rd place time |
| `$01F8`–`$01FB` | **DWORD** | Number | Wacky Workbench II, 1st place time |
| `$01FC`–`$01FF` | **DWORD** | Number | Unused |
| `$0200`–`$0203` | **DWORD** | Number | Wacky Workbench II, 2nd place time |
| `$0204`–`$0207` | **DWORD** | Number | Unused |
| `$0208`–`$020B` | **DWORD** | Number | Wacky Workbench II, 3rd place time |
| `$020C`–`$020F` | **DWORD** | Number | Unused |
| `$0210`–`$0213` | **DWORD** | Number | Wacky Workbench III, 1st place time |
| `$0214`–`$0217` | **DWORD** | Number | Unused |
| `$0218`–`$021B` | **DWORD** | Number | Wacky Workbench III, 2nd place time |
| `$021C`–`$021F` | **DWORD** | Number | Unused |
| `$0220`–`$0223` | **DWORD** | Number | Wacky Workbench III, 3rd place time |
| `$0224`–`$0227` | **DWORD** | Number | Unused |
| `$0228`–`$022B` | **DWORD** | Number | Stardust Speedway I, 1st place time |
| `$022C`–`$022F` | **DWORD** | Number | Special Zone 6, 1st place time |
| `$0230`–`$0233` | **DWORD** | Number | Stardust Speedway I, 2nd place time |
| `$0234`–`$0237` | **DWORD** | Number | Special Zone 6, 2nd place time |
| `$0238`–`$023B` | **DWORD** | Number | Stardust Speedway I, 3rd place time |
| `$023C`–`$023F` | **DWORD** | Number | Special Zone 6, 3rd place time |
| `$0240`–`$0243` | **DWORD** | Number | Stardust Speedway II, 1st place time |
| `$0244`–`$0247` | **DWORD** | Number | Unused |
| `$0248`–`$024B` | **DWORD** | Number | Stardust Speedway II, 2nd place time |
| `$024C`–`$024F` | **DWORD** | Number | Unused |
| `$0250`–`$0253` | **DWORD** | Number | Stardust Speedway II, 3rd place time |
| `$0254`–`$0257` | **DWORD** | Number | Unused |
| `$0258`–`$025B` | **DWORD** | Number | Stardust Speedway III, 1st place time |
| `$025C`–`$025F` | **DWORD** | Number | Unused |
| `$0260`–`$0263` | **DWORD** | Number | Stardust Speedway III, 2nd place time |
| `$0264`–`$0267` | **DWORD** | Number | Unused |
| `$0268`–`$026B` | **DWORD** | Number | Stardust Speedway III, 3rd place time |
| `$026C`–`$026F` | **DWORD** | Number | Unused |
| `$0270`–`$0273` | **DWORD** | Number | Metallic Madness I, 1st place time |
| `$0274`–`$0277` | **DWORD** | Number | Special Zone 7, 1st place time |
| `$0278`–`$027B` | **DWORD** | Number | Metallic Madness I, 2nd place time |
| `$027C`–`$027F` | **DWORD** | Number | Special Zone 7, 2nd place time |
| `$0280`–`$0283` | **DWORD** | Number | Metallic Madness I, 3rd place time |
| `$0284`–`$0287` | **DWORD** | Number | Special Zone 7, 3rd place time |
| `$0288`–`$028B` | **DWORD** | Number | Metallic Madness II, 1st place time |
| `$028C`–`$028F` | **DWORD** | Number | Unused |
| `$0290`–`$0293` | **DWORD** | Number | Metallic Madness II, 2nd place time |
| `$0294`–`$0297` | **DWORD** | Number | Unused |
| `$0298`–`$029B` | **DWORD** | Number | Metallic Madness II, 3rd place time |
| `$029C`–`$029F` | **DWORD** | Number | Unused |
| `$02A0`–`$02A3` | **DWORD** | Number | Metallic Madness III, 1st place time |
| `$02A4`–`$02A7` | **DWORD** | Number | Unused |
| `$02A8`–`$02AB` | **DWORD** | Number | Metallic Madness III, 2nd place time |
| `$02AC`–`$02AF` | **DWORD** | Number | Unused |
| `$02B0`–`$02B3` | **DWORD** | Number | Metallic Madness III, 3rd place time |
| `$02B4`–`$02B7` | **DWORD** | Number | Unused |

Unused values are set to `$3075`.

## Authors

- J.C. Fields <jcfields@jcfields.dev>

Credit to BiafraRepublic and RetroKoH for their specifications on the [Android version](https://forums.sonicretro.org/index.php?threads/sonic-cd-for-android-save-game-hacking-guide-1-0.27437/) and [iOS version](https://forums.sonicretro.org/index.php?threads/sonic-cd-2011-save-game-hex-editing-guide.29552/) respectively.
