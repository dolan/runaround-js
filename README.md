# runaround-js
My "Runaround" game implemented in HTML5/JS as a test of code generation assistance tools

The 'runaround' game concept is a project that I have been implementing
and re-implementing since I was 14 years old (in 1994). i

The timeline of Runaround
* 1994 - Originally implemented in Lightspeed C on a Mac Classic
   - The levels were designed by Rob Dolan (my brother)
* 2000 - Reimplemented in Borland C++ 5.0
* 2002 - Implemented again in Visual Basic 6.0
* 2005 - Implemented in ASP.NET MVC using C#, yes that was weird
* 2023 - September - Wrote the spec as a prompt, which is included in this repo
     - ChatGPT with GPT 4.0 was able to reason about how to construct
       the app, but was not able to build it for me in any working form
* 2024 - January - Claude 2.0 is able to reason about the app in more
       detail than was GPT 4.0, but still doesn't generate working code
     - April   - Claude 3.0 Opus is able to generate code to render the board
               - Mixtral 8x7B is able to generate code to render the
                 board
     - May     - GPT 4o (omni) is able to generate code to render the
               board, faulty, but working key stroke handling to move
               the player around. Game ending doesn't work, movement is
               super buggy.
     - June 23 - Claude 3.5 Sonnet is able to generate the mostly working
               game in one shot. I asked it to render the tiles using
               glyphs on raw background (one extra 1-line prompt in addition to
               spec file included in this repo)
     - June 25 - Claude 3.5 Sonnet and I have cycled through about 10 more times
               - added the arbitrary board size / scalable viewport
               - save to file (load from file coming soon)
