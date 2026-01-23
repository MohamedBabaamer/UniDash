// Node Class (Java)
class Node {
    int element;
    Node leftChild;
    Node rightChild;

    public Node(int element) {
        this.element = element;
        this.leftChild = null;
        this.rightChild = null;
    }
}

// Binary Tree Structure
public class BinaryTree {
    Node root;

    public BinaryTree() {
        this.root = null;
    }

    // Example: Tree Construction
    public static void main(String[] args) {
        BinaryTree tree = new BinaryTree();

        // Root
        tree.root = new Node(1);

        // First level
        tree.root.leftChild = new Node(2);
        tree.root.rightChild = new Node(3);

        // Second level (children of 2)
        tree.root.leftChild.leftChild = new Node(4);
        tree.root.leftChild.rightChild = new Node(5);

        // Second level (children of 3)
        tree.root.rightChild.leftChild = new Node(6);
        tree.root.rightChild.rightChild = new Node(7);
    }
}
