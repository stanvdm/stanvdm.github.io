# Hack the Future 2024
To get our active event, [Bram Lahousse](https://lahoussebram.github.io/) and I decided to team up and take on [challenge 102](https://www.hackthefuture.be/2024/index?challenge=102) at Hack the Future Antwerp 2024. The assignment was to create a web application called  "Galactic Explorer" using Laravel for the backend and VueJS and pannellum for the frontend.

The objective of the app was an interactive map of a galaxy. Users should be able to see celestial bodies and view details about them. If teams had time left over they could add the ability for users to add, edit and remove celestial bodies as well.

## The event
Before I go more in depth about the assignment, let's talk a bit about the event itself. The opening ceremony began at 9 in the morning. We arrived by train at around 8:30, with the event hall being right next to the station's exit.

Upon arrival, we were greeted with drinks and some snacks in a much more professional environment than I expected. Clearly a lot of effort was put into organization. We never lacked drinks snacks or a place to sit, throughout the entire day.

![Opening ceremony](/assets/images/hack-the-future-2024/opening-ceremony.jpg)

After a welcoming speech, people were divided into their respective groups per mission and were guided to their room. We then worked on the project until 12 o'clock, this was lunch time. We got to try an assortment of sandwiches and wraps.

![lunch](/assets/images/hack-the-future-2024/lunch.jpg)

After lunch it was back to programming. At 16 o'clock time was up, and we had to do our pitch. Presenting went smoothly for our entire group, so we went for a walk in Antwerp until 18:30, when it was time for lunch. Again there was an assortment of various dishes, all of which i wholeheartedly enjoyed.

Somewhere during lunch, the awards ceremony began. For each mission there were two awards, a jury award and a crowd award. After the awards were handed out, we had a few drinks and headed out. At the exit, we also got a goodie bag.

## Hacking time
The briefing of the assignment was very, well, brief. The two employees who were guiding our mission simply showed a demo and said: "This is the goal, work towards it using these technologies." I liked this a lot. I like figuring things out myself while having a clear goal to work towards. Whenever someone was really stuck, they would get help from the employees.

Bram and I decided to split the job into frontend and backend. Bram would tackle the backend and I would do the frontend. This ended up working quite well. While I was making the framework of the website, getting pannellum working, Bram created some dummy api endpoints. We used git to synchronize our code, allowing us to build on each other's work:

1. Bram created a dummy endpoint with static data
2. I pulled the changed and created the frontend for that endpoint
3. By the time I was done, Bram had a second dummy endpoint ready with the first being implemented with actual data
4. I then tested the actual endpoint and gave feedback
5. Rinse and repeat until the time was up

The end result ended up looking like this.

![Galactic Explorer demo](/assets/images/hack-the-future-2024/htf-demo.gif)

Our functionality ended up being among the best but on looks two other teams had us beat. This showed in the prises, as we got 3rd, making it into the nominations but losing on both the jury and crowd vote.

## Conclusion
The lesson learned here is that in a hackathon, not everything has to be perfect. We spent way too much time optimizing code and getting functionality that wouldn't really show in the demonstration. The next time I participate in an event like this, I will focus much more on the visuals and wow-effect than actual functionality.

This being said, I had a lot of fun during this event. Not only was the assignment fun, we could eat delicious food and talk to some like minded people. I will make sure to participate again in Hack the Future 2025.