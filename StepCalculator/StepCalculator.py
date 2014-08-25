def calcBalance(val, steps):
	return ((2**steps) * val) - val

def calcBetAmount(val, steps):
	return (val / (2**steps))

steps = int(raw_input("Number of security steps => "))
option = int(raw_input("Calcul with balance (1) or bet amount (2) => "));
if option is 1:
	val = float(raw_input("Balance value => "));
elif option is 2:
	val = float(raw_input("Bet amount value => "));

print "== For %d security steps with a %s of %f ==" % (steps, "balance" if option is 1 else "bet amount", val)

if option is 1:
 	print "=> The bet amount is %.8f" % calcBetAmount(val, steps) 

elif option is 2:
 	print "=> The balance value is %.8f" % calcBalance(val, steps)
