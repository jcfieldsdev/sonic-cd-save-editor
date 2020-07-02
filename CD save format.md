# *Sonic CD* for Sega CD save file format

This is a specification for the save file format used by the original version of *Sonic CD*, released in 1993 for the Sega CD/Mega CD.

## Overview

The Sega CD stores multiple save slots in internal memory or on a backup cartridge. Emulators replicate this functionality by creating a save file representing one or the other; this file can be anywhere from 8 KB (most common, since that is the internal memory space provided by actual Sega CD hardware) to 512 KB. Sega CD memory files end with the string `SEGA_CD_ROM\x00\x01\x00\x00\x00RAM_CARTRIDGE___`.

Save slots are organized in multiples of 64 bytes, called a "block." The save slot for *Sonic CD* is 11 blocks or 704 bytes. Its position in the save file can vary depending on what other saves exist (which can include other *Sonic CD* saves).

## Slot contents

Offsets are given from the beginning of the save slot. If the *Sonic CD* save is the first and only save in the save file (which is common with emulators, which typically provide each game with its own "internal memory" space), it starts after one block; that is, all positions are offset by `$40`.

| Offset | Size | Description |
| - | - | - |
| `$0000`–`$014F` | 336 bytes | *Time Attack* times (see subsection) |
| `$0150`–`$029F` | 336 bytes | *Time Attack* initials (see subsection) |
| `$02A0`–`$02A3` | 4 bytes | Default initials for *Time Attack* |
| `$02A4` | 1 byte | Current Round |
| `$02A5` | 1 byte | Completed Zones |
| `$02A6` | 1 byte | Always 0 |
| `$02A7` | 1 byte | Good Futures |
| `$02A8` | 1 byte | Title screen options |
| `$02A9`–`$02AB` | 3 bytes | Always 0 |
| `$02AC` | 1 byte | Next Special Zone |
| `$02AD` | 1 byte | Time Stones |
| `$02AE`–`$02BF` | 12 bytes | Always 0 |

### *Time Attack* times

The game stores three different time positions for each of the 21 Zones and 7 Special Zones, in the order of:

- Palmtree Panic I, 1st place
- Palmtree Panic I, 2nd place
- Palmtree Panic I, 3rd place
- Palmtree Panic II, 1st place
- Palmtree Panic II, 2nd place
- Palmtree Panic II, 3rd place
- ...
- Special Zone 6, 1st place
- Special Zone 6, 2nd place
- Special Zone 6, 3rd place
- Special Zone 7, 1st place
- Special Zone 7, 2nd place
- Special Zone 7, 3rd place

See **Appendix A** for a complete list of *Time Attack* time position offsets.

Each position consists of 4 bytes:

- First byte is always `$00`.
- Second byte is minutes.
- Third byte is seconds.
- Fourth byte is ticks.

Time in *Sonic CD* is kept in minutes, seconds, and ticks. Ticks are 1/60 of a second but displayed in-game as 1/100 of a second. The formula to convert from the stored form (1/60) to the displayed form (1/100) is ⌊ 100 × *tick* / 60 ⌋.

The default value is `$00050000` for 5 minutes.

The total time displayed on the *Time Attack* screen is computed by adding all of the first-place times in their converted, 1/100 of a second form. Adding times in their original, 1/60 of a second form and then converting the ticks to 1/100 results in a slightly different time from the one presented in-game.

### *Time Attack* initials

Initials are stored for each time position, again for each of the 21 Zones and 7 Special Zones and in the same order as the corresponding times section. See **Appendix B** for a complete list of *Time Attack* initial position offsets.

The initials consist of 4 bytes, one for each character followed by a null byte (`$00`).

Initial characters are stored as sprite offsets rather than using a character encoding; see **Appendix C** for a table of character values.

The default value is `$0B0B0B00` for "AAA".

### Default initials

The game remembers the last initials entered and uses them as the default values the next time a new fastest time is recorded.

The initials consist of 4 bytes, one for each character followed by a null byte (`$00`).

Initial characters are stored as sprite offsets rather than using a character encoding; see **Appendix C** for a table of character values.

The default value is `$23191F00` for "YOU".

### Current Round

The current Round. This is used by the *Continue* option on the title screen; the levels available in *Time Attack* mode are determined by a different value. Possible values:

| Value | Round |
| - | - |
| `$00` | Palmtree Panic |
| `$01` | Collision Chaos |
| `$02` | Tidal Tempest |
| `$03` | Quartz Quadrant |
| `$04` | Wacky Workbench |
| `$05` | Stardust Speedway |
| `$06` | Metallic Madness |

Completed games have a value of `$06`.

### Completed Zones

This value determines which levels are unlocked in *Time Attack* mode. Since games are only saved after each Round is completed, this value is only ever a multiple of three. If a different value is provided, the value of the next lowest multiple of three is used instead. Possible values:

| Value | Round |
| - | - |
| `$00` | *Time Attack* not available |
| `$03` | Palmtree Panic |
| `$06` | Collision Chaos |
| `$09` | Tidal Tempest |
| `$0C` | Quartz Quadrant |
| `$0F` | Wacky Workbench |
| `$12` | Stardust Speedway |
| `$15` | Metallic Madness |

Completed games have a value of `$15`.

### Good Futures

Tracks the Good Futures created by the player. A Good Future can be created in a particular Round by traveling to the Past in each of the first two Zones and finding and destroying the robot transporter machine. A Good Future is also created in each Round played after the player collects all of the Time Stones.

This is stored as a bit field of seven bits, each representing one of the game's seven Rounds, starting with the least significant bit:

```
0 1 1 1 1 1 1 1
  | | | | | | |
  | | | | | | Palmtree Panic
  | | | | | Collision Chaos
  | | | | Tidal Tempest
  | | | Quartz Quadrant
  | | Wacky Workbench
  | Stardust Speedway
  Metallic Madness
```

This can also be expressed as a sum of the powers of 2:

| Round | Value |
| - | - |
| Palmtree Panic | 1 |
| Collision Chaos | 2 |
| Tidal Tempest | 4 |
| Quartz Quadrant | 8 |
| Wacky Workbench | 16 |
| Stardust Speedway | 32 |
| Metallic Madness | 64 |

A value of `$7F` means that all of the Good Futures have been obtained.

### Title screen options

Determines the options that are available on the title screen. This is stored as a bit field:

```
0 1 1 1 1 1 0 0
  | | | | |
  | | | | Visual Mode
  | | | D.A. Garden
  | | RAM Data
  | Time Attack
  Continue
```

Or expressed as bytes:

| Value | Option |
| - | - |
| `$00` | *New Game* (always present) |
| `$04` | *Visual Mode* |
| `$08` | *D.A. Garden* |
| `$10` | *RAM Data* |
| `$20` | *Time Attack* |
| `$40` | *Continue* |

The most common values are `$10` for new game, `$70` to continue an existing game, and `$7C` for *Visual Mode* and *D.A. Garden* unlocked.

Save slots with a value of `$10` here are ignored by the game and treated as empty regardless of the contents of the rest of the data.

### Next Special Zone

The next Special Zone to be played, between `$00` and `$06`. The game goes through all of the Special Zones in rotation, skipping the ones that have already been successfully completed. This value is set to `$00` once the player has collected all of the Time Stones.

It is possible to set this value to that of a Special Zone that has already been completed. In this case, the selected Special Zone is played next but does not award another Time Stone if completed successfully (since each Special Zone is associated with a particular Time Stone).

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

## Appendices

### A. *Time Attack* time offsets

| Offset | Description |
| - | - |
| `$0000`–`$0003` | Palmtree Panic I, 1st place time |
| `$0004`–`$0007` | Palmtree Panic I, 2nd place time |
| `$0008`–`$000B` | Palmtree Panic I, 3rd place time |
| `$000C`–`$000F` | Palmtree Panic II, 1st place time |
| `$0010`–`$0013` | Palmtree Panic II, 2nd place time |
| `$0014`–`$0017` | Palmtree Panic II, 3rd place time |
| `$0018`–`$001B` | Palmtree Panic III, 1st place time |
| `$001C`–`$001F` | Palmtree Panic III, 2nd place time |
| `$0020`–`$0023` | Palmtree Panic III, 3rd place time |
| `$0024`–`$0027` | Collision Chaos I, 1st place time |
| `$0028`–`$002B` | Collision Chaos I, 2nd place time |
| `$002C`–`$002F` | Collision Chaos I, 3rd place time |
| `$0030`–`$0033` | Collision Chaos II, 1st place time |
| `$0034`–`$0037` | Collision Chaos II, 2nd place time |
| `$0038`–`$003B` | Collision Chaos II, 3rd place time |
| `$003C`–`$003F` | Collision Chaos III, 1st place time |
| `$0040`–`$0043` | Collision Chaos III, 2nd place time |
| `$0044`–`$0047` | Collision Chaos III, 3rd place time |
| `$0048`–`$004B` | Tidal Tempest I, 1st place time |
| `$004C`–`$004F` | Tidal Tempest I, 2nd place time |
| `$0050`–`$0053` | Tidal Tempest I, 3rd place time |
| `$0054`–`$0057` | Tidal Tempest II, 1st place time |
| `$0058`–`$005B` | Tidal Tempest II, 2nd place time |
| `$005C`–`$005F` | Tidal Tempest II, 3rd place time |
| `$0060`–`$0063` | Tidal Tempest III, 1st place time |
| `$0064`–`$0067` | Tidal Tempest III, 2nd place time |
| `$0068`–`$006B` | Tidal Tempest III, 3rd place time |
| `$006C`–`$006F` | Quartz Quadrant I, 1st place time |
| `$0070`–`$0073` | Quartz Quadrant I, 2nd place time |
| `$0074`–`$0077` | Quartz Quadrant I, 3rd place time |
| `$0078`–`$007B` | Quartz Quadrant II, 1st place time |
| `$007C`–`$007F` | Quartz Quadrant II, 2nd place time |
| `$0080`–`$0083` | Quartz Quadrant II, 3rd place time |
| `$0084`–`$0087` | Quartz Quadrant III, 1st place time |
| `$0088`–`$008B` | Quartz Quadrant III, 2nd place time |
| `$008C`–`$008F` | Quartz Quadrant III, 3rd place time |
| `$0090`–`$0093` | Wacky Workbench I, 1st place time |
| `$0094`–`$0097` | Wacky Workbench I, 2nd place time |
| `$0098`–`$009B` | Wacky Workbench I, 3rd place time |
| `$009C`–`$009F` | Wacky Workbench II, 1st place time |
| `$00A0`–`$00A3` | Wacky Workbench II, 2nd place time |
| `$00A4`–`$00A7` | Wacky Workbench II, 3rd place time |
| `$00A8`–`$00AB` | Wacky Workbench III, 1st place time |
| `$00AC`–`$00AF` | Wacky Workbench III, 2nd place time |
| `$00B0`–`$00B3` | Wacky Workbench III, 3rd place time |
| `$00B4`–`$00B7` | Stardust Speedway I, 1st place time |
| `$00B8`–`$00BB` | Stardust Speedway I, 2nd place time |
| `$00BC`–`$00BF` | Stardust Speedway I, 3rd place time |
| `$00C0`–`$00C3` | Stardust Speedway II, 1st place time |
| `$00C4`–`$00C7` | Stardust Speedway II, 2nd place time |
| `$00C8`–`$00CB` | Stardust Speedway II, 3rd place time |
| `$00CC`–`$00CF` | Stardust Speedway III, 1st place time |
| `$00D0`–`$00D3` | Stardust Speedway III, 2nd place time |
| `$00D4`–`$00D7` | Stardust Speedway III, 3rd place time |
| `$00D8`–`$00DB` | Metallic Madness I, 1st place time |
| `$00DC`–`$00DF` | Metallic Madness I, 2nd place time |
| `$00E0`–`$00E3` | Metallic Madness I, 3rd place time |
| `$00E4`–`$00E7` | Metallic Madness II, 1st place time |
| `$00E8`–`$00EB` | Metallic Madness II, 2nd place time |
| `$00EC`–`$00EF` | Metallic Madness II, 3rd place time |
| `$00F0`–`$00F3` | Metallic Madness III, 1st place time |
| `$00F4`–`$00F7` | Metallic Madness III, 2nd place time |
| `$00F8`–`$00FB` | Metallic Madness III, 3rd place time |
| `$00FC`–`$00FF` | Special Zone 1, 1st place time |
| `$0100`–`$0103` | Special Zone 1, 2nd place time |
| `$0104`–`$0107` | Special Zone 1, 3rd place time |
| `$0108`–`$010B` | Special Zone 2, 1st place time |
| `$010C`–`$010F` | Special Zone 2, 2nd place time |
| `$0110`–`$0113` | Special Zone 2, 3rd place time |
| `$0114`–`$0117` | Special Zone 3, 1st place time |
| `$0118`–`$011B` | Special Zone 3, 2nd place time |
| `$011C`–`$011F` | Special Zone 3, 3rd place time |
| `$0120`–`$0123` | Special Zone 4, 1st place time |
| `$0124`–`$0127` | Special Zone 4, 2nd place time |
| `$0128`–`$012B` | Special Zone 4, 3rd place time |
| `$012C`–`$012F` | Special Zone 5, 1st place time |
| `$0130`–`$0133` | Special Zone 5, 2nd place time |
| `$0134`–`$0137` | Special Zone 5, 3rd place time |
| `$0138`–`$013B` | Special Zone 6, 1st place time |
| `$013C`–`$013F` | Special Zone 6, 2nd place time |
| `$0140`–`$0143` | Special Zone 6, 3rd place time |
| `$0144`–`$0147` | Special Zone 7, 1st place time |
| `$0148`–`$014B` | Special Zone 7, 2nd place time |
| `$014C`–`$014F` | Special Zone 7, 3rd place time |

### B. *Time Attack* initial offsets

| Offset | Description |
| - | - |
| `$0150`–`$0153` | Palmtree Panic I, 1st place initials |
| `$0154`–`$0157` | Palmtree Panic I, 2nd place initials |
| `$0158`–`$015B` | Palmtree Panic I, 3rd place initials |
| `$015C`–`$015F` | Palmtree Panic II, 1st place initials |
| `$0160`–`$0163` | Palmtree Panic II, 2nd place initials |
| `$0164`–`$0167` | Palmtree Panic II, 3rd place initials |
| `$0168`–`$016B` | Palmtree Panic III, 1st place initials |
| `$016C`–`$016F` | Palmtree Panic III, 2nd place initials |
| `$0170`–`$0173` | Palmtree Panic III, 3rd place initials |
| `$0174`–`$0177` | Collision Chaos I, 1st place initials |
| `$0178`–`$017B` | Collision Chaos I, 2nd place initials |
| `$017C`–`$017F` | Collision Chaos I, 3rd place initials |
| `$0180`–`$0183` | Collision Chaos II, 1st place initials |
| `$0184`–`$0187` | Collision Chaos II, 2nd place initials |
| `$0188`–`$018B` | Collision Chaos II, 3rd place initials |
| `$018C`–`$018F` | Collision Chaos III, 1st place initials |
| `$0190`–`$0193` | Collision Chaos III, 2nd place initials |
| `$0194`–`$0197` | Collision Chaos III, 3rd place initials |
| `$0198`–`$019B` | Tidal Tempest I, 1st place initials |
| `$019C`–`$019F` | Tidal Tempest I, 2nd place initials |
| `$01A0`–`$01A3` | Tidal Tempest I, 3rd place initials |
| `$01A4`–`$01A7` | Tidal Tempest II, 1st place initials |
| `$01A8`–`$01AB` | Tidal Tempest II, 2nd place initials |
| `$01AC`–`$01AF` | Tidal Tempest II, 3rd place initials |
| `$01B0`–`$01B3` | Tidal Tempest III, 1st place initials |
| `$01B4`–`$01B7` | Tidal Tempest III, 2nd place initials |
| `$01B8`–`$01BB` | Tidal Tempest III, 3rd place initials |
| `$01BC`–`$01BF` | Quartz Quadrant I, 1st place initials |
| `$01C0`–`$01C3` | Quartz Quadrant I, 2nd place initials |
| `$01C4`–`$01C7` | Quartz Quadrant I, 3rd place initials |
| `$01C8`–`$01CB` | Quartz Quadrant II, 1st place initials |
| `$01CC`–`$01CF` | Quartz Quadrant II, 2nd place initials |
| `$01D0`–`$01D3` | Quartz Quadrant II, 3rd place initials |
| `$01D4`–`$01D7` | Quartz Quadrant III, 1st place initials |
| `$01D8`–`$01DB` | Quartz Quadrant III, 2nd place initials |
| `$01DC`–`$01DF` | Quartz Quadrant III, 3rd place initials |
| `$01E0`–`$01E3` | Wacky Workbench I, 1st place initials |
| `$01E4`–`$01E7` | Wacky Workbench I, 2nd place initials |
| `$01E8`–`$01EB` | Wacky Workbench I, 3rd place initials |
| `$01EC`–`$01EF` | Wacky Workbench II, 1st place initials |
| `$01F0`–`$01F3` | Wacky Workbench II, 2nd place initials |
| `$01F4`–`$01F7` | Wacky Workbench II, 3rd place initials |
| `$01F8`–`$01FB` | Wacky Workbench III, 1st place initials |
| `$01FC`–`$01FF` | Wacky Workbench III, 2nd place initials |
| `$0200`–`$0203` | Wacky Workbench III, 3rd place initials |
| `$0204`–`$0207` | Stardust Speedway I, 1st place initials |
| `$0208`–`$020B` | Stardust Speedway I, 2nd place initials |
| `$020C`–`$020F` | Stardust Speedway I, 3rd place initials |
| `$0210`–`$0213` | Stardust Speedway II, 1st place initials |
| `$0214`–`$0217` | Stardust Speedway II, 2nd place initials |
| `$0218`–`$021B` | Stardust Speedway II, 3rd place initials |
| `$021C`–`$021F` | Stardust Speedway III, 1st place initials |
| `$0220`–`$0223` | Stardust Speedway III, 2nd place initials |
| `$0224`–`$0227` | Stardust Speedway III, 3rd place initials |
| `$0228`–`$022B` | Metallic Madness I, 1st place initials |
| `$022C`–`$022F` | Metallic Madness I, 2nd place initials |
| `$0230`–`$0233` | Metallic Madness I, 3rd place initials |
| `$0234`–`$0237` | Metallic Madness II, 1st place initials |
| `$0238`–`$023B` | Metallic Madness II, 2nd place initials |
| `$023C`–`$023F` | Metallic Madness II, 3rd place initials |
| `$0240`–`$0243` | Metallic Madness III, 1st place initials |
| `$0244`–`$0247` | Metallic Madness III, 2nd place initials |
| `$0248`–`$024B` | Metallic Madness III, 3rd place initials |
| `$024C`–`$024F` | Special Zone 1, 1st place initials |
| `$0250`–`$0253` | Special Zone 1, 2nd place initials |
| `$0254`–`$0257` | Special Zone 1, 3rd place initials |
| `$0258`–`$025B` | Special Zone 2, 1st place initials |
| `$025C`–`$025F` | Special Zone 2, 2nd place initials |
| `$0260`–`$0263` | Special Zone 2, 3rd place initials |
| `$0264`–`$0267` | Special Zone 3, 1st place initials |
| `$0268`–`$026B` | Special Zone 3, 2nd place initials |
| `$026C`–`$026F` | Special Zone 3, 3rd place initials |
| `$0270`–`$0273` | Special Zone 4, 1st place initials |
| `$0274`–`$0277` | Special Zone 4, 2nd place initials |
| `$0278`–`$027B` | Special Zone 4, 3rd place initials |
| `$027C`–`$027F` | Special Zone 5, 1st place initials |
| `$0280`–`$0283` | Special Zone 5, 2nd place initials |
| `$0284`–`$0287` | Special Zone 5, 3rd place initials |
| `$0288`–`$028B` | Special Zone 6, 1st place initials |
| `$028C`–`$028F` | Special Zone 6, 2nd place initials |
| `$0290`–`$0293` | Special Zone 6, 3rd place initials |
| `$0294`–`$0297` | Special Zone 7, 1st place initials |
| `$0298`–`$029B` | Special Zone 7, 2nd place initials |
| `$029C`–`$029F` | Special Zone 7, 3rd place initials |

### C. Initial values

| Value | Character |
| - | - |
| `$00` | Space |
| `$01` | 0 |
| `$02` | 1 |
| `$03` | 2 |
| `$04` | 3 |
| `$05` | 4 |
| `$06` | 5 |
| `$07` | 6 |
| `$08` | 7 |
| `$09` | 8 |
| `$0A` | 9 |
| `$0B` | A |
| `$0C` | B |
| `$0D` | C |
| `$0E` | D |
| `$0F` | E |
| `$10` | F |
| `$11` | G |
| `$12` | H |
| `$13` | I |
| `$14` | J |
| `$15` | K |
| `$16` | L |
| `$17` | M |
| `$18` | N |
| `$19` | O |
| `$1A` | P |
| `$1B` | Q |
| `$1C` | R |
| `$1D` | S |
| `$1E` | T |
| `$1F` | U |
| `$20` | V |
| `$21` | W |
| `$22` | X |
| `$23` | Y |
| `$24` | Z |
| `$25` | Apostrophe |

## Authors

- J.C. Fields <jcfields@jcfields.dev>
