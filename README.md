## Counting Plugin

This plugin assists you with counting on Discord. 
It can check if someone miscounts and labels them if so in 1 specified channel.

This plugin is for Vencord or Vesktop, and requires you to build/install Vencord from source. See 
``https://docs.vencord.dev/installing/custom-plugins/`` for details.

### How to use
1) Install plugin
2) Enable plugin
3) Configure settings

#### Usage:

Each message sent (or loaded in any way) in the target channel(s) will have a MessageAccessory rendered under it.
This will indicate weather the message is: 

1) Correct, marked by ``[CORRECT]`` or ``[EXEMPT]`` if the message was exempted
2) Not readable (most likely not containing numbers), marked by ``REVIEW``
3) Incorrect (meaning the first number in the message is incorrect), marked by ``INCORRECT``

In the message options (when hovered), there will either be a Plus ("+") icon or an X icon only in the target channel.
The plus icon will exempt/add an exception for the message according to how the plugin is configured to handle it. 
The X icon will remove the exception for the message, and affects all messages after it too.

#### Settings:

> Target Channel:
> 
> Channel ID's to target, separated by a comma (",").

> Search Settings
> 
> Selects how you want this plugin to search and flag messages
> 
> Options: 
> 
> - Search From Baseline: 
>   
>   search and compare each message from the first message, and always checks the message with the last correct number.
> 
> - Backwards Search: 
>   
>   compare each message with the last valid message containing a number.
> 
> - Compare With Last Message: 
>  
>   compares each message with the previous consecutive message.

> Exemption Value:
> 
> Defines what exempting (allowing) a message does.
> 
> Options:
> 
> - Previous Correct:
> 
>   compare the exempted message with the previous correct number (this will enforce counting integrity for messages
>   after the targeted one).
> 
> - Next Valid Number:
> 
>   compare the exempted message with the next valid number (this will make all numbers after the exempted number correct).
> 
> - Compare With Last Message:
> 
>   compare the exempted message with the last message that is valid (has a number of some sorts).

> Count By Value:
> 
> Determines what hte increment to count by is in all target channels

### Notes

This is not an official plugin and is user created.

All message ordering is based on message IDs, numbers are always based on the first number sent in a user's message.

### License

MIT